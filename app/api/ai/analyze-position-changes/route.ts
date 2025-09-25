import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionLimits, incrementUsageCounter } from '@/lib/middleware/subscription-limits'
import { createPodcastAnalysis } from '@/lib/services/ai-analysis'

export async function POST(request: NextRequest) {
  try {
    // Проверяем лимиты подписки
    const { allowed, limits, error: limitError } = await checkSubscriptionLimits(request, 'ai_analysis')
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: limitError || 'Action not allowed',
          limits,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { podcastId } = await request.json()

    if (!podcastId) {
      return NextResponse.json(
        { error: 'Podcast ID is required' },
        { status: 400 }
      )
    }

    // Создаем AI анализ
    const analysis = await createPodcastAnalysis(podcastId)

    if (!analysis) {
      return NextResponse.json(
        { error: 'Insufficient data for analysis' },
        { status: 400 }
      )
    }

    // Увеличиваем счетчик использования
    await incrementUsageCounter(user.id, 'ai_analysis')

    return NextResponse.json({ 
      analysis,
      limits: limits
    })
  } catch (error) {
    console.error('Error analyzing position changes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
