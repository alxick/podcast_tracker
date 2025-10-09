import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionLimits } from '@/lib/middleware/subscription-limits'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data with usage counters
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan, podcasts_tracked, ai_analyses_used, charts_accessed')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get plan limits
    const getPlanLimits = (plan: string) => {
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

    const planLimits = getPlanLimits(userData.plan)

    const limits = {
      podcasts_tracked: userData.podcasts_tracked,
      ai_analyses_used: userData.ai_analyses_used,
      charts_accessed: userData.charts_accessed,
      max_podcasts: planLimits.max_podcasts,
      max_ai_analyses: planLimits.max_ai_analyses,
      max_charts: planLimits.max_charts,
      plan: userData.plan
    }

    return NextResponse.json({ limits })
  } catch (error) {
    console.error('Get user limits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
