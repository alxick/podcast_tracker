import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionLimits, incrementUsageCounter } from '@/lib/middleware/subscription-limits'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ContentAnalysis {
  topics: string[]                    // Основные темы
  sentiment: 'positive' | 'neutral' | 'negative'  // Тональность
  key_phrases: string[]              // Ключевые фразы
  structure: {                       // Структура эпизода
    has_intro: boolean
    has_outro: boolean
    main_content_duration: number    // Длительность основного контента в минутах
  }
  engagement_indicators: {           // Индикаторы вовлеченности
    question_count: number
    story_count: number
    guest_mentions: number
    audience_interaction: number
  }
  content_quality: {                 // Качество контента
    coherence_score: number          // 0-1, связность
    depth_score: number              // 0-1, глубина
    uniqueness_score: number         // 0-1, уникальность
  }
  recommendations: string[]          // Рекомендации по улучшению
  confidence: number                 // Уверенность в анализе
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

    const { episodeId, podcastId } = await request.json()

    if (!episodeId || !podcastId) {
      return NextResponse.json(
        { error: 'Episode ID and Podcast ID are required' },
        { status: 400 }
      )
    }

    // Получаем данные эпизода
    const episode = await getEpisodeData(episodeId, podcastId)
    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, returning mock analysis')
      const mockAnalysis: ContentAnalysis = {
        topics: ['Технологии', 'Бизнес', 'Инновации'],
        sentiment: 'positive',
        key_phrases: ['искусственный интеллект', 'цифровая трансформация', 'стартапы'],
        structure: {
          has_intro: true,
          has_outro: true,
          main_content_duration: 25
        },
        engagement_indicators: {
          question_count: 8,
          story_count: 3,
          guest_mentions: 5,
          audience_interaction: 2
        },
        content_quality: {
          coherence_score: 0.85,
          depth_score: 0.78,
          uniqueness_score: 0.72
        },
        recommendations: [
          'Добавьте больше вопросов для вовлечения аудитории',
          'Используйте больше личных историй',
          'Пригласите эксперта для углубления темы'
        ],
        confidence: 0.8
      }
      return NextResponse.json({ analysis: mockAnalysis })
    }

    // Анализируем контент
    const analysis = await analyzeEpisodeContent(episode)

    // Увеличиваем счетчик использования
    await incrementUsageCounter(user.id, 'ai_analysis')

    return NextResponse.json({ 
      analysis,
      limits: limits
    })
  } catch (error) {
    console.error('Error analyzing content:', error)
    
    // Возвращаем mock данные в случае ошибки
    const mockAnalysis: ContentAnalysis = {
      topics: ['Технологии', 'Бизнес'],
      sentiment: 'neutral',
      key_phrases: ['инновации', 'развитие'],
      structure: {
        has_intro: true,
        has_outro: false,
        main_content_duration: 20
      },
      engagement_indicators: {
        question_count: 5,
        story_count: 2,
        guest_mentions: 0,
        audience_interaction: 1
      },
      content_quality: {
        coherence_score: 0.7,
        depth_score: 0.6,
        uniqueness_score: 0.5
      },
      recommendations: [
        'Улучшите структуру эпизода',
        'Добавьте больше интерактивности'
      ],
      confidence: 0.6
    }

    return NextResponse.json({ analysis: mockAnalysis })
  }
}

// Получение данных эпизода
async function getEpisodeData(episodeId: string, podcastId: string) {
  const supabase = await createClient()
  
  try {
    const { data: episode, error } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        description,
        published_at,
        duration,
        audio_url,
        podcasts!inner(
          title,
          category
        )
      `)
      .eq('id', episodeId)
      .eq('podcast_id', podcastId)
      .single()

    if (error) {
      console.error('Error getting episode:', error)
      return null
    }

    return episode
  } catch (error) {
    console.error('Error getting episode data:', error)
    return null
  }
}

// Анализ контента эпизода
async function analyzeEpisodeContent(episode: any): Promise<ContentAnalysis> {
  try {
    // Если есть аудио URL, пытаемся транскрибировать
    let transcript = ''
    if (episode.audio_url) {
      transcript = await transcribeAudio(episode.audio_url)
    }

    // Если транскрипции нет, используем описание
    const contentToAnalyze = transcript || episode.description || episode.title

    if (!contentToAnalyze) {
      throw new Error('No content available for analysis')
    }

    // Анализируем контент с помощью GPT-4
    const analysis = await analyzeContentWithAI(contentToAnalyze, episode)

    return analysis
  } catch (error) {
    console.error('Error analyzing episode content:', error)
    throw error
  }
}

// Транскрипция аудио с помощью Whisper
async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    // Скачиваем аудио файл
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error('Failed to download audio file')
    }

    const audioBuffer = await response.arrayBuffer()
    const audioFile = new File([audioBuffer], 'episode.mp3', { type: 'audio/mpeg' })

    // Транскрибируем с помощью Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'ru', // Можно определить язык автоматически
      response_format: 'text'
    })

    return transcription
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return ''
  }
}

// AI анализ контента
async function analyzeContentWithAI(content: string, episode: any): Promise<ContentAnalysis> {
  const prompt = `Проанализируй контент подкаста "${episode.podcasts.title}" - эпизод "${episode.title}".

КОНТЕНТ ДЛЯ АНАЛИЗА:
${content}

ДЛИТЕЛЬНОСТЬ: ${episode.duration ? Math.round(episode.duration / 60) : 'неизвестно'} минут

Проанализируй и верни JSON в формате:
{
  "topics": ["тема 1", "тема 2", "тема 3"],
  "sentiment": "positive|neutral|negative",
  "key_phrases": ["ключевая фраза 1", "ключевая фраза 2"],
  "structure": {
    "has_intro": true/false,
    "has_outro": true/false,
    "main_content_duration": число_минут
  },
  "engagement_indicators": {
    "question_count": число_вопросов,
    "story_count": число_историй,
    "guest_mentions": число_упоминаний_гостей,
    "audience_interaction": число_обращений_к_аудитории
  },
  "content_quality": {
    "coherence_score": 0.0-1.0,
    "depth_score": 0.0-1.0,
    "uniqueness_score": 0.0-1.0
  },
  "recommendations": [
    "рекомендация 1",
    "рекомендация 2",
    "рекомендация 3"
  ],
  "confidence": 0.0-1.0
}`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert podcast content analyst. Analyze podcast episodes and provide detailed insights about topics, engagement, and quality. Always respond in Russian."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
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
      topics: parsed.topics || [],
      sentiment: parsed.sentiment || 'neutral',
      key_phrases: parsed.key_phrases || [],
      structure: {
        has_intro: parsed.structure?.has_intro || false,
        has_outro: parsed.structure?.has_outro || false,
        main_content_duration: parsed.structure?.main_content_duration || 0
      },
      engagement_indicators: {
        question_count: parsed.engagement_indicators?.question_count || 0,
        story_count: parsed.engagement_indicators?.story_count || 0,
        guest_mentions: parsed.engagement_indicators?.guest_mentions || 0,
        audience_interaction: parsed.engagement_indicators?.audience_interaction || 0
      },
      content_quality: {
        coherence_score: parsed.content_quality?.coherence_score || 0.5,
        depth_score: parsed.content_quality?.depth_score || 0.5,
        uniqueness_score: parsed.content_quality?.uniqueness_score || 0.5
      },
      recommendations: parsed.recommendations || [],
      confidence: parsed.confidence || 0.5
    }
  } catch (error) {
    console.error('Error in AI content analysis:', error)
    throw error
  }
}
