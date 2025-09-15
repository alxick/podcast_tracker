import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCustomer, createCheckoutSession, createPrice } from '@/lib/services/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planId } = await request.json()

    if (!planId || !['starter', 'pro', 'agency'].includes(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // Получаем или создаем Stripe customer
    let customerId = user.stripe_customer_id

    if (!customerId) {
      const customer = await createCustomer(user.email, user.name)
      customerId = customer.id

      // Сохраняем customer ID в БД
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Создаем price для плана
    const price = await createPrice(planId)
    if (!price) {
      return NextResponse.json(
        { error: 'Failed to create price' },
        { status: 500 }
      )
    }

    // Создаем checkout session
    const session = await createCheckoutSession(
      customerId,
      price.id,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`
    )

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
