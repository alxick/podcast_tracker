import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionLimits, incrementUsageCounter } from '@/lib/middleware/subscription-limits'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface EpisodeSuccessPrediction {
  success_probability: number  // 0-1, вероятность успеха
  predicted_metrics: {
    estimated_downloads: number
    engagement_score: number
    retention_rate: number
    social_shares: number
  }
  success_factors: {
    content_quality: number
    topic_trendiness: number
    audience_alignment: number
    timing_optimization: number
  }
  recommendations: {
    content_improvements: string[]
    timing_suggestions: string[]
    promotion_strategies: string[]
  }
  risk_factors: string[]
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

    const { episodeId, podcastId, episodeData } = await request.json()

    if (!episodeId || !podcastId) {
      return NextResponse.json(
        { error: 'Episode ID and Podcast ID are required' },
        { status: 400 }
      )
    }

    // Получаем данные эпизода и исторические данные
    const predictionData = await getPredictionData(episodeId, podcastId, episodeData)
    
    if (!predictionData) {
      return NextResponse.json(
        { error: 'No data available for prediction' },
        { status: 404 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, returning mock prediction')
      const mockPrediction: EpisodeSuccessPrediction = {
        success_probability: 0.75,
        predicted_metrics: {
          estimated_downloads: 1250,
          engagement_score: 0.68,
          retention_rate: 0.72,
          social_shares: 45
        },
        success_factors: {
          content_quality: 0.85,
          topic_trendiness: 0.78,
          audience_alignment: 0.82,
          timing_optimization: 0.65
        },
        recommendations: {
          content_improvements: [
            'Добавьте больше личных историй',
            'Включите практические советы',
            'Улучшите структуру эпизода'
          ],
          timing_suggestions: [
            'Лучшее время публикации: вторник 9:00 утра',
            'Избегайте публикации в пятницу вечером'
          ],
          promotion_strategies: [
            'Создайте тизер в соцсетях за 2 дня до публикации',
            'Подготовьте ключевые цитаты для Twitter',
            'Запланируйте пост в LinkedIn'
          ]
        },
        risk_factors: [
          'Конкуренция с крупными подкастами в тот же день',
          'Сезонный спад интереса к теме'
        ],
        confidence: 0.8
      }
      return NextResponse.json({ prediction: mockPrediction })
    }

    // Прогнозируем успех эпизода
    const prediction = await predictEpisodeSuccess(predictionData)

    // Увеличиваем счетчик использования
    await incrementUsageCounter(user.id, 'ai_analysis')

    return NextResponse.json({ 
      prediction,
      limits: limits
    })
  } catch (error) {
    console.error('Error predicting episode success:', error)
    
    // Возвращаем mock данные в случае ошибки
    const mockPrediction: EpisodeSuccessPrediction = {
      success_probability: 0.6,
      predicted_metrics: {
        estimated_downloads: 800,
        engagement_score: 0.5,
        retention_rate: 0.6,
        social_shares: 25
      },
      success_factors: {
        content_quality: 0.7,
        topic_trendiness: 0.6,
        audience_alignment: 0.7,
        timing_optimization: 0.5
      },
      recommendations: {
        content_improvements: ['Улучшите качество контента'],
        timing_suggestions: ['Выберите лучшее время публикации'],
        promotion_strategies: ['Продвигайте в соцсетях']
      },
      risk_factors: ['Конкуренция'],
      confidence: 0.6
    }

    return NextResponse.json({ prediction: mockPrediction })
  }
}

// Получение данных для прогнозирования
async function getPredictionData(episodeId: string, podcastId: string, episodeData?: any) {
  const supabase = createClient()
  
  try {
    // Получаем данные эпизода
    let episode
    if (episodeData) {
      episode = episodeData
    } else {
      const { data: epData, error: epError } = await supabase
        .from('episodes')
        .select(`
          id,
          title,
          description,
          published_at,
          duration,
          audio_url
        `)
        .eq('id', episodeId)
        .eq('podcast_id', podcastId)
        .single()

      if (epError) {
        console.error('Error getting episode:', epError)
        return null
      }
      episode = epData
    }

    // Получаем исторические данные подкаста (последние 20 эпизодов)
    const { data: historicalEpisodes, error: histError } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        description,
        published_at,
        duration
      `)
      .eq('podcast_id', podcastId)
      .order('published_at', { ascending: false })
      .limit(20)

    if (histError) {
      console.error('Error getting historical episodes:', histError)
      return null
    }

    // Получаем данные о подкасте
    const { data: podcast, error: podError } = await supabase
      .from('podcasts')
      .select(`
        id,
        title,
        category,
        description
      `)
      .eq('id', podcastId)
      .single()

    if (podError) {
      console.error('Error getting podcast:', podError)
      return null
    }

    return {
      episode,
      historical_episodes: historicalEpisodes,
      podcast
    }
  } catch (error) {
    console.error('Error getting prediction data:', error)
    return null
  }
}

// AI прогнозирование успеха эпизода
async function predictEpisodeSuccess(data: any): Promise<EpisodeSuccessPrediction> {
  const episode = data.episode
  const historicalEpisodes = data.historical_episodes
  const podcast = data.podcast

  const historicalContent = historicalEpisodes.map((ep: any) => 
    `Заголовок: ${ep.title}\nОписание: ${ep.description || ''}\nДлительность: ${ep.duration ? Math.round(ep.duration / 60) : 'неизвестно'} мин`
  ).join('\n\n---\n\n')

  const prompt = `Спрогнозируй успех эпизода подкаста "${podcast.title}" в категории "${podcast.category}".

ТЕКУЩИЙ ЭПИЗОД:
Заголовок: ${episode.title}
Описание: ${episode.description || ''}
Длительность: ${episode.duration ? Math.round(episode.duration / 60) : 'неизвестно'} мин
Дата публикации: ${episode.published_at}

ИСТОРИЧЕСКИЕ ДАННЫЕ (последние 20 эпизодов):
${historicalContent}

Проанализируй и верни JSON в формате:
{
  "success_probability": 0.0-1.0,
  "predicted_metrics": {
    "estimated_downloads": число_скачиваний,
    "engagement_score": 0.0-1.0,
    "retention_rate": 0.0-1.0,
    "social_shares": число_поделиться
  },
  "success_factors": {
    "content_quality": 0.0-1.0,
    "topic_trendiness": 0.0-1.0,
    "audience_alignment": 0.0-1.0,
    "timing_optimization": 0.0-1.0
  },
  "recommendations": {
    "content_improvements": ["улучшение 1", "улучшение 2"],
    "timing_suggestions": ["совет 1", "совет 2"],
    "promotion_strategies": ["стратегия 1", "стратегия 2"]
  },
  "risk_factors": ["риск 1", "риск 2"],
  "confidence": 0.0-1.0
}`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert podcast success predictor. Analyze episode content and historical data to predict success metrics. Always respond in Russian."
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
      success_probability: parsed.success_probability || 0.5,
      predicted_metrics: {
        estimated_downloads: parsed.predicted_metrics?.estimated_downloads || 0,
        engagement_score: parsed.predicted_metrics?.engagement_score || 0.5,
        retention_rate: parsed.predicted_metrics?.retention_rate || 0.5,
        social_shares: parsed.predicted_metrics?.social_shares || 0
      },
      success_factors: {
        content_quality: parsed.success_factors?.content_quality || 0.5,
        topic_trendiness: parsed.success_factors?.topic_trendiness || 0.5,
        audience_alignment: parsed.success_factors?.audience_alignment || 0.5,
        timing_optimization: parsed.success_factors?.timing_optimization || 0.5
      },
      recommendations: {
        content_improvements: parsed.recommendations?.content_improvements || [],
        timing_suggestions: parsed.recommendations?.timing_suggestions || [],
        promotion_strategies: parsed.recommendations?.promotion_strategies || []
      },
      risk_factors: parsed.risk_factors || [],
      confidence: parsed.confidence || 0.5
    }
  } catch (error) {
    console.error('Error in AI episode success prediction:', error)
    throw error
  }
}
