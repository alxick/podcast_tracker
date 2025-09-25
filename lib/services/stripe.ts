import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
}) : null

export const subscriptionPlans = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month' as const,
    features: [
      '1 подкаст',
      'Топ-10 чартов',
      'Ежедневный дайджест',
      'Базовые уведомления'
    ],
    limits: {
      podcasts: 1,
      charts: 10,
      ai_analysis: false,
      api_access: false
    }
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 1000, // $10.00 в центах
    interval: 'month' as const,
    features: [
      '5 подкастов',
      'Топ-50 чартов',
      'Email уведомления',
      'Анализ конкурентов',
      'Приоритетная поддержка'
    ],
    limits: {
      podcasts: 5,
      charts: 50,
      ai_analysis: false,
      api_access: false
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 2000, // $20.00 в центах
    interval: 'month' as const,
    features: [
      '20 подкастов',
      'Топ-200 чартов',
      'AI-анализ обложек',
      'Telegram уведомления',
      'Мгновенные алерты',
      'Экспорт данных'
    ],
    limits: {
      podcasts: 20,
      charts: 200,
      ai_analysis: true,
      api_access: false
    }
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    price: 9900, // $99.00 в центах
    interval: 'month' as const,
    features: [
      '100+ подкастов',
      'Все чарты',
      'AI-анализ обложек',
      'API доступ',
      'Белый лейбл',
      'Персональный менеджер'
    ],
    limits: {
      podcasts: 100,
      charts: 1000,
      ai_analysis: true,
      api_access: true
    }
  }
}

// Создание Stripe customer
export async function createCustomer(email: string, name?: string) {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    })
    return customer
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw error
  }
}

// Создание checkout session
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    })
    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Создание billing portal session
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
    return session
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    throw error
  }
}

// Получение subscription
export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Error getting subscription:', error)
    throw error
  }
}

// Отмена subscription
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

// Получение всех products и prices
export async function getProducts() {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const products = await stripe.products.list({
      active: true,
    })
    
    const prices = await stripe.prices.list({
      active: true,
    })
    
    return { products, prices }
  } catch (error) {
    console.error('Error getting products:', error)
    throw error
  }
}

// Создание price для плана
export async function createPrice(planId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const plan = subscriptionPlans[planId as keyof typeof subscriptionPlans]
    if (!plan || plan.price === 0) {
      return null
    }
    
    // Сначала проверяем, существует ли уже price для этого плана
    const existingPrices = await stripe.prices.list({
      active: true,
      type: 'recurring',
    })
    
    const existingPrice = existingPrices.data.find(p => 
      p.unit_amount === plan.price && 
      p.recurring?.interval === plan.interval
    )
    
    if (existingPrice) {
      return existingPrice
    }
    
    const price = await stripe.prices.create({
      unit_amount: plan.price,
      currency: 'usd',
      recurring: {
        interval: plan.interval,
      },
      product_data: {
        name: plan.name,
      },
    })
    
    return price
  } catch (error) {
    console.error('Error creating price:', error)
    throw error
  }
}
