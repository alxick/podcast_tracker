'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { subscriptionPlans } from '@/lib/services/stripe'
import { useRouter } from 'next/navigation'

interface UpgradePromptProps {
  currentPlan: string
  feature: string
  onUpgrade?: () => void
}

export function UpgradePrompt({ currentPlan, feature, onUpgrade }: UpgradePromptProps) {
  const router = useRouter()
  
  const getUpgradeMessage = (plan: string, feature: string) => {
    const messages = {
      podcasts: {
        free: 'Обновитесь до Starter для отслеживания до 5 подкастов',
        starter: 'Обновитесь до Pro для отслеживания до 20 подкастов',
        pro: 'Обновитесь до Agency для отслеживания до 100+ подкастов'
      },
      charts: {
        free: 'Обновитесь до Starter для просмотра топ-50 чартов',
        starter: 'Обновитесь до Pro для просмотра топ-200 чартов',
        pro: 'Обновитесь до Agency для просмотра всех чартов'
      },
      ai_analysis: {
        free: 'Обновитесь до Pro для AI-анализа обложек',
        starter: 'Обновитесь до Pro для AI-анализа обложек'
      },
      api_access: {
        free: 'Обновитесь до Agency для API доступа',
        starter: 'Обновитесь до Agency для API доступа',
        pro: 'Обновитесь до Agency для API доступа'
      }
    }
    
    return messages[feature as keyof typeof messages]?.[plan as keyof typeof messages[keyof typeof messages]] || 
           'Обновите план для доступа к этой функции'
  }

  const getRecommendedPlan = (currentPlan: string, feature: string) => {
    if (feature === 'ai_analysis' || feature === 'api_access') {
      return currentPlan === 'free' || currentPlan === 'starter' ? 'pro' : 'agency'
    }
    
    if (feature === 'podcasts') {
      if (currentPlan === 'free') return 'starter'
      if (currentPlan === 'starter') return 'pro'
      return 'agency'
    }
    
    if (feature === 'charts') {
      if (currentPlan === 'free') return 'starter'
      if (currentPlan === 'starter') return 'pro'
      return 'agency'
    }
    
    return 'starter'
  }

  const recommendedPlan = getRecommendedPlan(currentPlan, feature)
  const planConfig = subscriptionPlans[recommendedPlan as keyof typeof subscriptionPlans]

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      router.push('/billing')
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-amber-600">🔒</span>
          Ограничение тарифа
        </CardTitle>
        <CardDescription>
          {getUpgradeMessage(currentPlan, feature)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Рекомендуемый план: {planConfig.name}</h4>
              <p className="text-sm text-gray-600">
                ${planConfig.price / 100}/месяц
              </p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              {planConfig.name}
            </Badge>
          </div>
          
          <div>
            <h5 className="font-medium mb-2">Включено в план:</h5>
            <ul className="text-sm space-y-1">
              {planConfig.features.slice(0, 3).map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <Button onClick={handleUpgrade} className="w-full">
            Обновить план
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
