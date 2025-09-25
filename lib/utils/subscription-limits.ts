import { subscriptionPlans } from '@/lib/services/stripe'

export interface SubscriptionPlanLimits {
  podcasts: number
  charts: number
  ai_analysis: boolean
  api_access: boolean
}

export function getSubscriptionLimits(plan: string): SubscriptionPlanLimits {
  const planConfig = subscriptionPlans[plan as keyof typeof subscriptionPlans]
  
  if (!planConfig) {
    // Возвращаем лимиты free плана по умолчанию
    return subscriptionPlans.free.limits
  }
  
  return planConfig.limits
}

export function canAddPodcast(currentCount: number, plan: string): boolean {
  const limits = getSubscriptionLimits(plan)
  return currentCount < limits.podcasts
}

export function canViewCharts(plan: string, requestedLimit: number): boolean {
  const limits = getSubscriptionLimits(plan)
  return requestedLimit <= limits.charts
}

export function canUseAIAnalysis(plan: string): boolean {
  const limits = getSubscriptionLimits(plan)
  return limits.ai_analysis
}

export function canAccessAPI(plan: string): boolean {
  const limits = getSubscriptionLimits(plan)
  return limits.api_access
}

export function getUpgradeMessage(currentPlan: string, feature: string): string {
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
  
  return messages[feature as keyof typeof messages]?.[currentPlan as keyof typeof messages[keyof typeof messages]] || 
         'Обновите план для доступа к этой функции'
}
