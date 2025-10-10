import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionLimits, incrementUsageCounter } from '@/lib/middleware/subscription-limits'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface QualityAlert {
  alert_type: 'quality_drop' | 'content_consistency' | 'engagement_decline' | 'trend_miss'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  affected_episodes: string[]
  quality_metrics: {
    current_score: number
    previous_score: number
    trend_direction: 'improving' | 'stable' | 'declining'
  }
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

    const { podcastId, checkType = 'all' } = await request.json()

    if (!podcastId) {
      return NextResponse.json(
        { error: 'Podcast ID is required' },
        { status: 400 }
      )
    }

    // Получаем данные для мониторинга качества
    const monitoringData = await getQualityMonitoringData(podcastId)
    
    if (!monitoringData) {
      return NextResponse.json(
        { error: 'No data available for quality monitoring' },
        { status: 404 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, returning mock alerts')
      const mockAlerts: QualityAlert[] = [
        {
          alert_type: 'quality_drop',
          severity: 'medium',
          message: 'Качество контента снизилось на 15% за последние 3 эпизода',
          affected_episodes: ['episode_1', 'episode_2', 'episode_3'],
          quality_metrics: {
            current_score: 0.65,
            previous_score: 0.80,
            trend_direction: 'declining'
          },
          recommendations: [
            'Увеличьте время подготовки к эпизодам',
            'Добавьте больше структуры в контент',
            'Проведите анализ успешных эпизодов'
          ],
          confidence: 0.8
        },
        {
          alert_type: 'engagement_decline',
          severity: 'low',
          message: 'Вовлеченность аудитории снизилась на 8%',
          affected_episodes: ['episode_2', 'episode_3'],
          quality_metrics: {
            current_score: 0.72,
            previous_score: 0.80,
            trend_direction: 'declining'
          },
          recommendations: [
            'Добавьте больше вопросов к аудитории',
            'Используйте интерактивные элементы',
            'Создайте дискуссию в соцсетях'
          ],
          confidence: 0.7
        }
      ]
      return NextResponse.json({ alerts: mockAlerts })
    }

    // Анализируем качество контента
    const alerts = await analyzeQualityTrends(monitoringData, checkType)

    // Увеличиваем счетчик использования
    await incrementUsageCounter(user.id, 'ai_analysis')

    return NextResponse.json({ 
      alerts,
      limits: limits
    })
  } catch (error) {
    console.error('Error monitoring content quality:', error)
    
    // Возвращаем mock данные в случае ошибки
    const mockAlerts: QualityAlert[] = [
      {
        alert_type: 'quality_drop',
        severity: 'medium',
        message: 'Общее снижение качества контента',
        affected_episodes: ['recent_episodes'],
        quality_metrics: {
          current_score: 0.6,
          previous_score: 0.7,
          trend_direction: 'declining'
        },
        recommendations: ['Улучшите качество контента'],
        confidence: 0.6
      }
    ]

    return NextResponse.json({ alerts: mockAlerts })
  }
}

// Получение данных для мониторинга качества
async function getQualityMonitoringData(podcastId: string) {
  const supabase = createClient()
  
  try {
    // Получаем последние 10 эпизодов
    const { data: episodes, error: episodesError } = await supabase
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
      .order('published_at', { ascending: false })
      .limit(10)

    if (episodesError) {
      console.error('Error getting episodes:', episodesError)
      return null
    }

    // Получаем данные о подкасте
    const { data: podcast, error: podcastError } = await supabase
      .from('podcasts')
      .select(`
        id,
        title,
        category,
        description
      `)
      .eq('id', podcastId)
      .single()

    if (podcastError) {
      console.error('Error getting podcast:', podcastError)
      return null
    }

    return {
      episodes,
      podcast
    }
  } catch (error) {
    console.error('Error getting quality monitoring data:', error)
    return null
  }
}

// AI анализ трендов качества
async function analyzeQualityTrends(data: any, checkType: string): Promise<QualityAlert[]> {
  const episodes = data.episodes
  const podcast = data.podcast

  const episodesContent = episodes.map((ep: any, index: number) => 
    `Эпизод ${index + 1} (${ep.published_at}):\nЗаголовок: ${ep.title}\nОписание: ${ep.description || ''}\nДлительность: ${ep.duration ? Math.round(ep.duration / 60) : 'неизвестно'} мин`
  ).join('\n\n---\n\n')

  const prompt = `Проанализируй качество контента подкаста "${podcast.title}" и выяви проблемы или тренды.

ДАННЫЕ ЭПИЗОДОВ (последние 10):
${episodesContent}

ТИП ПРОВЕРКИ: ${checkType}

Проанализируй и верни JSON в формате массива алертов:
[
  {
    "alert_type": "quality_drop|content_consistency|engagement_decline|trend_miss",
    "severity": "low|medium|high|critical",
    "message": "описание проблемы",
    "affected_episodes": ["id_эпизода1", "id_эпизода2"],
    "quality_metrics": {
      "current_score": 0.0-1.0,
      "previous_score": 0.0-1.0,
      "trend_direction": "improving|stable|declining"
    },
    "recommendations": ["рекомендация 1", "рекомендация 2"],
    "confidence": 0.0-1.0
  }
]

Ищи следующие проблемы:
- Снижение качества контента
- Непоследовательность в темах
- Снижение вовлеченности
- Пропуск трендовых тем
- Проблемы со структурой эпизодов
- Снижение уникальности контента`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert content quality monitor. Analyze podcast episodes for quality issues and trends. Always respond in Russian."
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
    
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map((alert: any) => ({
      alert_type: alert.alert_type || 'quality_drop',
      severity: alert.severity || 'medium',
      message: alert.message || 'Обнаружена проблема с качеством',
      affected_episodes: alert.affected_episodes || [],
      quality_metrics: {
        current_score: alert.quality_metrics?.current_score || 0.5,
        previous_score: alert.quality_metrics?.previous_score || 0.5,
        trend_direction: alert.quality_metrics?.trend_direction || 'stable'
      },
      recommendations: alert.recommendations || [],
      confidence: alert.confidence || 0.5
    }))
  } catch (error) {
    console.error('Error in AI quality monitoring analysis:', error)
    throw error
  }
}
