'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { subscriptionPlans } from '@/lib/services/stripe'
import { SubscriptionPlan } from '@/lib/types/database'

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadSubscriptionData()
    }
  }, [user])

  const loadSubscriptionData = async () => {
    try {
      setIsLoadingData(true)
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setCurrentPlan(data.user.plan)
        setSubscriptionData(data)
      }
    } catch (error) {
      console.error('Error loading subscription data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free' || planId === currentPlan) return

    setLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        const { sessionId } = await response.json()
        
        // Перенаправляем на Stripe Checkout
        const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({ sessionId })
          if (error) {
            console.error('Stripe error:', error)
            alert('Ошибка при создании платежа')
          }
        }
      } else {
        const errorData = await response.json()
        console.error('API error:', errorData.error)
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
      alert('Произошла ошибка при обновлении плана')
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
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      alert('Произошла ошибка при создании портала управления')
    }
  }

  const handleSyncSubscription = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Подписка синхронизирована! План: ${data.plan}`)
        // Перезагружаем данные
        await loadSubscriptionData()
      } else {
        const errorData = await response.json()
        console.error('API error:', errorData.error)
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error syncing subscription:', error)
      alert('Произошла ошибка при синхронизации подписки')
    } finally {
      setIsSyncing(false)
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
            {isLoadingData ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">Загрузка...</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {subscriptionPlans[currentPlan as keyof typeof subscriptionPlans]?.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {currentPlan === 'free' ? 'Бесплатный план' : `$${subscriptionPlans[currentPlan as keyof typeof subscriptionPlans]?.price! / 100}/месяц`}
                  </p>
                  {subscriptionData?.subscription && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Статус: {subscriptionData.subscription.status}</p>
                      {subscriptionData.subscription.current_period_end && (
                        <p>
                          Следующее продление: {new Date(subscriptionData.subscription.current_period_end).toLocaleDateString('ru-RU')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSyncSubscription}
                    disabled={isSyncing}
                  >
                    {isSyncing ? 'Синхронизация...' : 'Синхронизировать с Stripe'}
                  </Button>
                  {currentPlan !== 'free' && (
                    <Button 
                      variant="outline" 
                      onClick={handleManageBilling}
                    >
                      Управлять подпиской
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(subscriptionPlans).map(([planId, plan]: [string, SubscriptionPlan]) => (
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
                  {plan.features.map((feature: string, index: number) => (
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
