import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface SubscriptionLimits {
  podcasts_tracked: number
  ai_analyses_used: number
  charts_accessed: number
  max_podcasts: number
  max_ai_analyses: number
  max_charts: number
  plan: string
}

export async function checkSubscriptionLimits(
  request: NextRequest,
  actionType: 'track_podcast' | 'ai_analysis' | 'access_charts'
): Promise<{ allowed: boolean; limits?: SubscriptionLimits; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { allowed: false, error: 'Unauthorized' }
    }

    // Get user data with usage counters
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan, podcasts_tracked, ai_analyses_used, charts_accessed')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { allowed: false, error: 'User not found' }
    }

    // Check if user can perform action using database function
    const { data: canPerform, error: checkError } = await supabase
      .rpc('can_perform_action', {
        user_id: user.id,
        action_type: actionType
      })

    if (checkError) {
      console.error('Error checking action permission:', checkError)
      return { allowed: false, error: 'Database error' }
    }

    if (!canPerform) {
      // Get limits for error message
      const limits = getPlanLimits(userData.plan)
      return { 
        allowed: false, 
        limits: {
          ...limits,
          podcasts_tracked: userData.podcasts_tracked,
          ai_analyses_used: userData.ai_analyses_used,
          charts_accessed: userData.charts_accessed,
          plan: userData.plan
        },
        error: getLimitExceededMessage(actionType, userData.plan)
      }
    }

    // Get current limits for response
    const limits = getPlanLimits(userData.plan)
    return {
      allowed: true,
      limits: {
        ...limits,
        podcasts_tracked: userData.podcasts_tracked,
        ai_analyses_used: userData.ai_analyses_used,
        charts_accessed: userData.charts_accessed,
        plan: userData.plan
      }
    }
  } catch (error) {
    console.error('Error checking subscription limits:', error)
    return { allowed: false, error: 'Internal server error' }
  }
}

export async function incrementUsageCounter(
  userId: string,
  actionType: 'track_podcast' | 'ai_analysis' | 'access_charts'
): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .rpc('increment_usage_counter', {
        user_id: userId,
        action_type: actionType
      })

    if (error) {
      console.error('Error incrementing usage counter:', error)
    }
  } catch (error) {
    console.error('Error incrementing usage counter:', error)
  }
}

function getPlanLimits(plan: string): Omit<SubscriptionLimits, 'podcasts_tracked' | 'ai_analyses_used' | 'charts_accessed' | 'plan'> {
  switch (plan) {
    case 'free':
      return {
        max_podcasts: 1, // 1 подкаст
        max_ai_analyses: 1, // 1 AI анализ навсегда
        max_charts: 10 // топ-10 чартов
      }
    case 'starter':
      return {
        max_podcasts: 5, // 5 подкастов
        max_ai_analyses: 10, // 10 AI анализов в месяц
        max_charts: 50 // топ-50 чартов
      }
    case 'pro':
      return {
        max_podcasts: 20, // 20 подкастов
        max_ai_analyses: 999999, // Безлимитные AI анализы
        max_charts: 999999 // Все чарты
      }
    case 'agency':
      return {
        max_podcasts: 999999, // Безлимитные подкасты
        max_ai_analyses: 999999, // Безлимитные AI анализы
        max_charts: 999999 // Все чарты + API
      }
    default:
      return {
        max_podcasts: 0,
        max_ai_analyses: 0,
        max_charts: 0
      }
  }
}

function getLimitExceededMessage(actionType: string, plan: string): string {
  const limits = getPlanLimits(plan)
  
  switch (actionType) {
    case 'track_podcast':
      return `You've reached the limit of ${limits.max_podcasts} tracked podcasts for your ${plan} plan. Upgrade to track more podcasts.`
    case 'ai_analysis':
      return `You've reached the limit of ${limits.max_ai_analyses} AI analyses for your ${plan} plan. Upgrade for more analyses.`
    case 'access_charts':
      return `You've reached the limit of ${limits.max_charts} chart accesses for your ${plan} plan. Upgrade for unlimited access.`
    default:
      return 'Action not allowed with your current plan.'
  }
}

export function withSubscriptionLimit(
  actionType: 'track_podcast' | 'ai_analysis' | 'access_charts'
) {
  return function (handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>) {
    return async function (req: NextRequest, ...args: unknown[]) {
      const { allowed, limits, error } = await checkSubscriptionLimits(req, actionType)
      
      if (!allowed) {
        return NextResponse.json(
          { 
            error: error || 'Action not allowed',
            limits,
            upgradeRequired: true
          },
          { status: 403 }
        )
      }

      // Add limits to request headers for use in handler
      if (limits) {
        req.headers.set('x-subscription-limits', JSON.stringify(limits))
      }

      return handler(req, ...args)
    }
  }
}
