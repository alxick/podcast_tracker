import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Получаем данные пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer ID found' },
        { status: 400 }
      )
    }

    // Получаем подписки пользователя из Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      // Нет активных подписок - устанавливаем free план
      await supabase
        .from('users')
        .update({ plan: 'free' })
        .eq('id', user.id)

      return NextResponse.json({
        message: 'No active subscriptions found, set to free plan',
        plan: 'free'
      })
    }

    const subscription = subscriptions.data[0]
    
    // Определяем план по цене
    const priceId = subscription.items.data[0].price.id
    const price = await stripe.prices.retrieve(priceId)
    
    let planId = 'free'
    switch (price.unit_amount) {
      case 1000: planId = 'starter'; break
      case 2000: planId = 'pro'; break
      case 9900: planId = 'agency'; break
    }

    // Создаем или обновляем запись подписки в БД
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: user.stripe_customer_id,
        plan: planId,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000),
        current_period_end: new Date((subscription as any).current_period_end * 1000),
        cancel_at_period_end: (subscription as any).cancel_at_period_end
      }, {
        onConflict: 'stripe_subscription_id'
      })

    // Обновляем план пользователя
    await supabase
      .from('users')
      .update({ plan: planId })
      .eq('id', user.id)

    return NextResponse.json({
      message: 'Subscription synced successfully',
      plan: planId,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: new Date((subscription as any).current_period_end * 1000)
      }
    })
  } catch (error) {
    console.error('Error syncing subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
