import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { sendWelcomeEmail } from '@/lib/services/notifications'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const customerId = session.customer as string
          
          // Обновляем план пользователя
          const planId = await getPlanIdFromPriceId(subscription.items.data[0].price.id)
          
          await supabase
            .from('users')
            .update({ plan: planId })
            .eq('stripe_customer_id', customerId)
          
          console.log(`User ${customerId} upgraded to ${planId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        if (subscription.status === 'active') {
          const planId = await getPlanIdFromPriceId(subscription.items.data[0].price.id)
          
          await supabase
            .from('users')
            .update({ plan: planId })
            .eq('stripe_customer_id', customerId)
        } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          await supabase
            .from('users')
            .update({ plan: 'free' })
            .eq('stripe_customer_id', customerId)
        }
        
        console.log(`Subscription updated for customer ${customerId}: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        await supabase
          .from('users')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', customerId)
        
        console.log(`Subscription canceled for customer ${customerId}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        // Отправляем приветственное письмо при первой оплате
        if (invoice.billing_reason === 'subscription_create') {
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()
          
          if (user) {
            await sendWelcomeEmail(user.id)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        console.log(`Payment failed for customer ${customerId}`)
        // Здесь можно отправить email о неудачной оплате
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Вспомогательная функция для определения плана по price ID
async function getPlanIdFromPriceId(priceId: string): Promise<string> {
  try {
    // Получаем информацию о price из Stripe
    const price = await stripe.prices.retrieve(priceId)
    
    // Определяем план по цене
    switch (price.unit_amount) {
      case 1000: return 'starter'
      case 2000: return 'pro'
      case 9900: return 'agency'
      default: return 'starter'
    }
  } catch (error) {
    console.error('Error getting price info:', error)
    return 'starter'
  }
}
