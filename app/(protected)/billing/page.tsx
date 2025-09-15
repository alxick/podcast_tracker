'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { subscriptionPlans } from '@/lib/services/stripe'

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('free')
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // В реальном приложении получаем план из БД
      setCurrentPlan('free')
    }
  }, [user])

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        const { sessionId } = await response.json()
        
        // Перенаправляем на Stripe Checkout
        const stripe = await import('@stripe/stripe-js')
        const stripeInstance = await stripe.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        
        if (stripeInstance) {
          const { error } = await stripeInstance.redirectToCheckout({ sessionId })
          if (error) {
            console.error('Stripe checkout error:', error)
          }
        }
      } else {
        const errorData = await response.json()
        console.error('API error:', errorData.error)
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const errorData = await response.json()
        console.error('API error:', errorData.error)
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Подписка
        </h1>
        <p className="text-gray-600">
          Управляйте своей подпиской и тарифным планом
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Текущий план</CardTitle>
            <CardDescription>
              Ваша текущая подписка
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {subscriptionPlans[currentPlan as keyof typeof subscriptionPlans]?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentPlan === 'free' ? 'Бесплатный план' : `$${subscriptionPlans[currentPlan as keyof typeof subscriptionPlans]?.price! / 100}/месяц`}
                </p>
              </div>
              {currentPlan !== 'free' && (
                <Button variant="outline" onClick={handleManageBilling}>
                  Управлять подпиской
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(subscriptionPlans).map(([planId, plan]) => (
            <Card 
              key={planId} 
              className={currentPlan === planId ? 'border-blue-500 bg-blue-50' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {currentPlan === planId && (
                    <Badge>Текущий</Badge>
                  )}
                </div>
                <CardDescription>
                  {plan.price === 0 ? 'Бесплатно' : `$${plan.price / 100}/месяц`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  disabled={currentPlan === planId || loading}
                  onClick={() => handleUpgrade(planId)}
                >
                  {currentPlan === planId ? 'Текущий план' : 
                   planId === 'free' ? 'Недоступно' : 
                   loading ? 'Загрузка...' : 'Выбрать план'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Часто задаваемые вопросы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Могу ли я отменить подписку в любое время?</h4>
              <p className="text-sm text-gray-600">
                Да, вы можете отменить подписку в любое время. Доступ к функциям плана сохранится до конца текущего периода оплаты.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Что происходит при отмене подписки?</h4>
              <p className="text-sm text-gray-600">
                Ваш аккаунт переходит на бесплатный план. Данные сохраняются, но некоторые функции становятся недоступными.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Могу ли я изменить план?</h4>
              <p className="text-sm text-gray-600">
                Да, вы можете обновить или понизить план в любое время через настройки подписки.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
