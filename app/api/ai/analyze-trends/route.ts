import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionLimits, incrementUsageCounter } from '@/lib/middleware/subscription-limits'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface TrendAnalysis {
  trending_topics: string[]
  seasonal_patterns: string[]
  competitor_moves: string[]
  opportunity_alerts: string[]
  recommendations: string[]
  confidence: number
}

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

    const { podcastId, category } = await request.json()

    if (!podcastId || !category) {
      return NextResponse.json(
        { error: 'Podcast ID and category are required' },
        { status: 400 }
      )
    }

    // Получаем данные о трендах в категории
    const trendData = await getTrendData(podcastId, category)
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, returning mock analysis')
      const mockAnalysis: TrendAnalysis = {
        trending_topics: ['AI и технологии', 'Психология', 'Бизнес-стратегии'],
        seasonal_patterns: ['Рост интереса к новогодним темам в декабре'],
        competitor_moves: ['Конкуренты увеличили частоту публикации', 'Новые гости в топовых подкастах'],
        opportunity_alerts: ['Недооцененная тема: устойчивое развитие', 'Возможность пригласить эксперта по AI'],
        recommendations: [
          'Создайте серию эпизодов о трендах 2024 года',
          'Пригласите эксперта по психологии для роста аудитории',
          'Публикуйте эпизоды во вторник утром для максимального охвата'
        ],
        confidence: 0.7
      }
      return NextResponse.json({ analysis: mockAnalysis })
    }

    // Анализируем тренды с помощью AI
    const analysis = await analyzeTrendsWithAI(trendData, category)

    // Увеличиваем счетчик использования
    await incrementUsageCounter(user.id, 'ai_analysis')

    return NextResponse.json({ 
      analysis,
      limits: limits
    })
  } catch (error) {
    console.error('Error analyzing trends:', error)
    
    // Возвращаем mock данные в случае ошибки
    const mockAnalysis: TrendAnalysis = {
      trending_topics: ['AI и технологии', 'Психология', 'Бизнес-стратегии'],
      seasonal_patterns: ['Рост интереса к новогодним темам в декабре'],
      competitor_moves: ['Конкуренты увеличили частоту публикации'],
      opportunity_alerts: ['Недооцененная тема: устойчивое развитие'],
      recommendations: [
        'Создайте серию эпизодов о трендах 2024 года',
        'Пригласите эксперта по психологии для роста аудитории'
      ],
      confidence: 0.6
    }

    return NextResponse.json({ analysis: mockAnalysis })
  }
}

// Получение данных о трендах
async function getTrendData(podcastId: string, category: string) {
  const supabase = await createClient()
  
  try {
    // Получаем топ-20 подкастов в категории за последние 30 дней
    const { data: topPodcasts, error: topError } = await supabase
      .from('charts')
      .select(`
        podcast_id,
        position,
        date,
        podcasts!inner(
          title,
          episodes(
            title,
            published_at,
            description
          )
        )
      `)
      .eq('category', category)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('position', { ascending: true })
      .limit(20)

    if (topError) {
      console.error('Error getting top podcasts:', topError)
      return null
    }

    // Анализируем темы эпизодов
    const allEpisodes = topPodcasts.flatMap(p => p.podcasts?.[0]?.episodes || [])
    const recentEpisodes = allEpisodes
      .filter(ep => new Date(ep.published_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .slice(0, 50) // Берем последние 50 эпизодов

    return {
      topPodcasts: topPodcasts.length,
      recentEpisodes: recentEpisodes.length,
      episodeTitles: recentEpisodes.map(ep => ep.title),
      episodeDescriptions: recentEpisodes.map(ep => ep.description).filter(Boolean)
    }
  } catch (error) {
    console.error('Error getting trend data:', error)
    return null
  }
}

// AI анализ трендов
async function analyzeTrendsWithAI(trendData: any, category: string): Promise<TrendAnalysis> {
  if (!trendData) {
    throw new Error('No trend data available')
  }

  const prompt = `Проанализируй тренды в категории подкастов "${category}" на основе следующих данных:

ТОП ПОДКАСТОВ: ${trendData.topPodcasts} подкастов в топе
НЕДАВНИЕ ЭПИЗОДЫ: ${trendData.recentEpisodes} эпизодов за последнюю неделю

НАЗВАНИЯ ЭПИЗОДОВ:
${trendData.episodeTitles.slice(0, 20).join('\n')}

ОПИСАНИЯ ЭПИЗОДОВ:
${trendData.episodeDescriptions.slice(0, 10).join('\n')}

Проанализируй и верни JSON в формате:
{
  "trending_topics": ["популярная тема 1", "популярная тема 2", "популярная тема 3"],
  "seasonal_patterns": ["сезонный паттерн 1", "сезонный паттерн 2"],
  "competitor_moves": ["что делают конкуренты 1", "что делают конкуренты 2"],
  "opportunity_alerts": ["возможность 1", "возможность 2"],
  "recommendations": ["рекомендация 1", "рекомендация 2", "рекомендация 3"],
  "confidence": 0.85
}`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert podcast trend analyst. Analyze trends in podcast categories and provide actionable insights. Always respond in Russian."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7
    })

    const analysisText = response.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('No analysis returned from OpenAI')
    }

    // Парсим JSON ответ
    const cleanText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const parsed = JSON.parse(cleanText)
    
    return {
      trending_topics: parsed.trending_topics || [],
      seasonal_patterns: parsed.seasonal_patterns || [],
      competitor_moves: parsed.competitor_moves || [],
      opportunity_alerts: parsed.opportunity_alerts || [],
      recommendations: parsed.recommendations || [],
      confidence: parsed.confidence || 0.5
    }
  } catch (error) {
    console.error('Error in AI trend analysis:', error)
    throw error
  }
}
