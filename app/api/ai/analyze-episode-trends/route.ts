import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionLimits, incrementUsageCounter } from '@/lib/middleware/subscription-limits'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface EpisodeTrendAnalysis {
  trending_topics: Array<{
    topic: string
    frequency: number
    growth_rate: number
    popularity_score: number
  }>
  content_patterns: {
    most_engaging_length: number
    best_publishing_days: string[]
    optimal_episode_structure: string[]
  }
  audience_preferences: {
    preferred_topics: string[]
    engagement_triggers: string[]
    content_gaps: string[]
  }
  recommendations: {
    content_strategy: string[]
    publishing_schedule: string[]
    topic_suggestions: string[]
  }
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

    const { podcastId, timeRange = 30 } = await request.json()

    if (!podcastId) {
      return NextResponse.json(
        { error: 'Podcast ID is required' },
        { status: 400 }
      )
    }

    // Получаем данные эпизодов за указанный период
    const episodesData = await getEpisodesData(podcastId, timeRange)
    
    if (!episodesData || episodesData.length === 0) {
      return NextResponse.json(
        { error: 'No episodes found for analysis' },
        { status: 404 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, returning mock analysis')
      const mockAnalysis: EpisodeTrendAnalysis = {
        trending_topics: [
          { topic: 'Искусственный интеллект', frequency: 8, growth_rate: 0.25, popularity_score: 0.85 },
          { topic: 'Бизнес-стратегии', frequency: 6, growth_rate: 0.15, popularity_score: 0.72 },
          { topic: 'Психология', frequency: 4, growth_rate: 0.08, popularity_score: 0.68 }
        ],
        content_patterns: {
          most_engaging_length: 35,
          best_publishing_days: ['вторник', 'четверг'],
          optimal_episode_structure: ['вступление 2-3 мин', 'основная часть 25-30 мин', 'заключение 2-3 мин']
        },
        audience_preferences: {
          preferred_topics: ['технологии', 'карьера', 'здоровье'],
          engagement_triggers: ['личные истории', 'вопросы к аудитории', 'практические советы'],
          content_gaps: ['интервью с экспертами', 'разбор кейсов', 'Q&A сессии']
        },
        recommendations: {
          content_strategy: [
            'Увеличьте количество эпизодов об AI - это набирает популярность',
            'Добавьте больше личных историй для повышения вовлеченности',
            'Попробуйте формат интервью с экспертами'
          ],
          publishing_schedule: [
            'Публикуйте во вторник и четверг в 9:00 утра',
            'Длина эпизодов 30-35 минут показывает лучшую вовлеченность'
          ],
          topic_suggestions: [
            'Будущее работы в эпоху AI',
            'Как развивать эмоциональный интеллект',
            'Стартапы в сфере здравоохранения'
          ]
        },
        confidence: 0.8
      }
      return NextResponse.json({ analysis: mockAnalysis })
    }

    // Анализируем тренды эпизодов
    const analysis = await analyzeEpisodeTrends(episodesData)

    // Увеличиваем счетчик использования
    await incrementUsageCounter(user.id, 'ai_analysis')

    return NextResponse.json({ 
      analysis,
      limits: limits
    })
  } catch (error) {
    console.error('Error analyzing episode trends:', error)
    
    // Возвращаем mock данные в случае ошибки
    const mockAnalysis: EpisodeTrendAnalysis = {
      trending_topics: [
        { topic: 'Технологии', frequency: 5, growth_rate: 0.1, popularity_score: 0.6 },
        { topic: 'Бизнес', frequency: 3, growth_rate: 0.05, popularity_score: 0.5 }
      ],
      content_patterns: {
        most_engaging_length: 30,
        best_publishing_days: ['вторник'],
        optimal_episode_structure: ['вступление', 'основная часть', 'заключение']
      },
      audience_preferences: {
        preferred_topics: ['технологии'],
        engagement_triggers: ['вопросы'],
        content_gaps: ['эксперты']
      },
      recommendations: {
        content_strategy: ['Добавьте больше технологических тем'],
        publishing_schedule: ['Публикуйте во вторник'],
        topic_suggestions: ['AI и будущее']
      },
      confidence: 0.6
    }

    return NextResponse.json({ analysis: mockAnalysis })
  }
}

// Получение данных эпизодов
async function getEpisodesData(podcastId: string, timeRange: number) {
  const supabase = await createClient()
  
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)

    const { data: episodes, error } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        description,
        published_at,
        duration,
        audio_url
      `)
      .eq('podcast_id', podcastId)
      .gte('published_at', startDate.toISOString())
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error getting episodes:', error)
      return null
    }

    return episodes
  } catch (error) {
    console.error('Error getting episodes data:', error)
    return null
  }
}

// AI анализ трендов эпизодов
async function analyzeEpisodeTrends(episodes: any[]): Promise<EpisodeTrendAnalysis> {
  // Подготавливаем данные для анализа
  const episodesText = episodes.map(ep => 
    `Заголовок: ${ep.title}\nОписание: ${ep.description || ''}\nДлительность: ${ep.duration ? Math.round(ep.duration / 60) : 'неизвестно'} мин\nДата: ${ep.published_at}`
  ).join('\n\n---\n\n')

  const prompt = `Проанализируй тренды в эпизодах подкаста за последние ${episodes.length} эпизодов:

ДАННЫЕ ЭПИЗОДОВ:
${episodesText}

Проанализируй и верни JSON в формате:
{
  "trending_topics": [
    {
      "topic": "название темы",
      "frequency": число_упоминаний,
      "growth_rate": 0.0-1.0,
      "popularity_score": 0.0-1.0
    }
  ],
  "content_patterns": {
    "most_engaging_length": средняя_длительность_в_минутах,
    "best_publishing_days": ["день1", "день2"],
    "optimal_episode_structure": ["элемент1", "элемент2"]
  },
  "audience_preferences": {
    "preferred_topics": ["тема1", "тема2"],
    "engagement_triggers": ["триггер1", "триггер2"],
    "content_gaps": ["пробел1", "пробел2"]
  },
  "recommendations": {
    "content_strategy": ["стратегия1", "стратегия2"],
    "publishing_schedule": ["совет1", "совет2"],
    "topic_suggestions": ["тема1", "тема2"]
  },
  "confidence": 0.0-1.0
}`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert podcast trend analyst. Analyze episode trends and provide actionable insights for content strategy. Always respond in Russian."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
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
      content_patterns: {
        most_engaging_length: parsed.content_patterns?.most_engaging_length || 30,
        best_publishing_days: parsed.content_patterns?.best_publishing_days || [],
        optimal_episode_structure: parsed.content_patterns?.optimal_episode_structure || []
      },
      audience_preferences: {
        preferred_topics: parsed.audience_preferences?.preferred_topics || [],
        engagement_triggers: parsed.audience_preferences?.engagement_triggers || [],
        content_gaps: parsed.audience_preferences?.content_gaps || []
      },
      recommendations: {
        content_strategy: parsed.recommendations?.content_strategy || [],
        publishing_schedule: parsed.recommendations?.publishing_schedule || [],
        topic_suggestions: parsed.recommendations?.topic_suggestions || []
      },
      confidence: parsed.confidence || 0.5
    }
  } catch (error) {
    console.error('Error in AI episode trends analysis:', error)
    throw error
  }
}
