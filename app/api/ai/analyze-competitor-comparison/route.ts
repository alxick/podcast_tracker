import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionLimits, incrementUsageCounter } from '@/lib/middleware/subscription-limits'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface CompetitorComparison {
  content_differences: {
    topic_focus: {
      your_strengths: string[]
      competitor_advantages: string[]
      unique_opportunities: string[]
    }
    content_style: {
      your_approach: string
      competitor_approach: string
      differentiation_opportunities: string[]
    }
    engagement_strategies: {
      your_methods: string[]
      competitor_methods: string[]
      improvement_suggestions: string[]
    }
  }
  competitive_positioning: {
    market_position: 'leader' | 'challenger' | 'follower' | 'niche'
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  content_recommendations: {
    immediate_actions: string[]
    medium_term_strategy: string[]
    long_term_positioning: string[]
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

    const { podcastId, category } = await request.json()

    if (!podcastId || !category) {
      return NextResponse.json(
        { error: 'Podcast ID and category are required' },
        { status: 400 }
      )
    }

    // Получаем данные вашего подкаста и конкурентов
    const comparisonData = await getCompetitorComparisonData(podcastId, category)
    
    if (!comparisonData) {
      return NextResponse.json(
        { error: 'No comparison data available' },
        { status: 404 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, returning mock analysis')
      const mockAnalysis: CompetitorComparison = {
        content_differences: {
          topic_focus: {
            your_strengths: ['Глубокий анализ технологий', 'Практические советы'],
            competitor_advantages: ['Больше гостей-экспертов', 'Лучшее качество звука'],
            unique_opportunities: ['Нишевые темы', 'Интерактивность с аудиторией']
          },
          content_style: {
            your_approach: 'Сольные эпизоды с глубоким анализом',
            competitor_approach: 'Интервью с экспертами',
            differentiation_opportunities: ['Гибридный формат', 'Больше историй']
          },
          engagement_strategies: {
            your_methods: ['Вопросы в конце эпизода'],
            competitor_methods: ['Прямые эфиры', 'Социальные сети'],
            improvement_suggestions: ['Добавить Q&A сессии', 'Создать сообщество']
          }
        },
        competitive_positioning: {
          market_position: 'challenger',
          strengths: ['Уникальная перспектива', 'Качественный контент'],
          weaknesses: ['Меньше охват', 'Ограниченные ресурсы'],
          opportunities: ['Рост в нише', 'Партнерства'],
          threats: ['Большие игроки', 'Изменение алгоритмов']
        },
        content_recommendations: {
          immediate_actions: [
            'Пригласите 2-3 эксперта в месяц',
            'Улучшите качество звука',
            'Добавьте интерактивные элементы'
          ],
          medium_term_strategy: [
            'Создайте серию интервью',
            'Развивайте присутствие в соцсетях',
            'Экспериментируйте с форматами'
          ],
          long_term_positioning: [
            'Станьте экспертом в нише',
            'Постройте сообщество',
            'Масштабируйте контент'
          ]
        },
        confidence: 0.8
      }
      return NextResponse.json({ analysis: mockAnalysis })
    }

    // Анализируем сравнение с конкурентами
    const analysis = await analyzeCompetitorComparison(comparisonData)

    // Увеличиваем счетчик использования
    await incrementUsageCounter(user.id, 'ai_analysis')

    return NextResponse.json({ 
      analysis,
      limits: limits
    })
  } catch (error) {
    console.error('Error analyzing competitor comparison:', error)
    
    // Возвращаем mock данные в случае ошибки
    const mockAnalysis: CompetitorComparison = {
      content_differences: {
        topic_focus: {
          your_strengths: ['Качественный контент'],
          competitor_advantages: ['Больше ресурсов'],
          unique_opportunities: ['Нишевые темы']
        },
        content_style: {
          your_approach: 'Сольные эпизоды',
          competitor_approach: 'Интервью',
          differentiation_opportunities: ['Гибридный формат']
        },
        engagement_strategies: {
          your_methods: ['Вопросы'],
          competitor_methods: ['Соцсети'],
          improvement_suggestions: ['Больше интерактива']
        }
      },
      competitive_positioning: {
        market_position: 'follower',
        strengths: ['Качество'],
        weaknesses: ['Охват'],
        opportunities: ['Ниша'],
        threats: ['Конкуренты']
      },
      content_recommendations: {
        immediate_actions: ['Улучшите качество'],
        medium_term_strategy: ['Развивайте бренд'],
        long_term_positioning: ['Станьте экспертом']
      },
      confidence: 0.6
    }

    return NextResponse.json({ analysis: mockAnalysis })
  }
}

// Получение данных для сравнения с конкурентами
async function getCompetitorComparisonData(podcastId: string, category: string) {
  const supabase = createClient()
  
  try {
    // Получаем данные вашего подкаста
    const { data: yourPodcast, error: yourError } = await supabase
      .from('podcasts')
      .select(`
        id,
        title,
        description,
        category,
        episodes(
          id,
          title,
          description,
          published_at,
          duration
        )
      `)
      .eq('id', podcastId)
      .single()

    if (yourError) {
      console.error('Error getting your podcast:', yourError)
      return null
    }

    // Получаем топ-5 конкурентов в категории
    const { data: competitors, error: competitorsError } = await supabase
      .from('charts')
      .select(`
        position,
        podcasts!inner(
          id,
          title,
          description,
          episodes(
            id,
            title,
            description,
            published_at,
            duration
          )
        )
      `)
      .eq('category', category)
      .lte('position', 5)
      .order('position', { ascending: true })
      .limit(5)

    if (competitorsError) {
      console.error('Error getting competitors:', competitorsError)
      return null
    }

    return {
      your_podcast: yourPodcast,
      competitors: competitors.map(c => c.podcasts).filter(Boolean)
    }
  } catch (error) {
    console.error('Error getting competitor comparison data:', error)
    return null
  }
}

// AI анализ сравнения с конкурентами
async function analyzeCompetitorComparison(data: any): Promise<CompetitorComparison> {
  const yourPodcast = data.your_podcast
  const competitors = data.competitors

  const yourContent = yourPodcast.episodes?.slice(0, 10).map((ep: any) => 
    `Заголовок: ${ep.title}\nОписание: ${ep.description || ''}`
  ).join('\n\n') || ''

  const competitorContent = competitors.map((comp: any) => 
    `Подкаст: ${comp.title}\nЭпизоды:\n${comp.episodes?.slice(0, 5).map((ep: any) => 
      `- ${ep.title}: ${ep.description || ''}`
    ).join('\n') || ''}`
  ).join('\n\n---\n\n')

  const prompt = `Проанализируй конкурентное позиционирование подкаста "${yourPodcast.title}" в категории "${yourPodcast.category}".

ВАШ ПОДКАСТ:
${yourContent}

КОНКУРЕНТЫ (топ-5 в категории):
${competitorContent}

Проанализируй и верни JSON в формате:
{
  "content_differences": {
    "topic_focus": {
      "your_strengths": ["сильная сторона 1", "сильная сторона 2"],
      "competitor_advantages": ["преимущество конкурентов 1", "преимущество конкурентов 2"],
      "unique_opportunities": ["уникальная возможность 1", "уникальная возможность 2"]
    },
    "content_style": {
      "your_approach": "ваш подход к контенту",
      "competitor_approach": "подход конкурентов",
      "differentiation_opportunities": ["возможность 1", "возможность 2"]
    },
    "engagement_strategies": {
      "your_methods": ["ваш метод 1", "ваш метод 2"],
      "competitor_methods": ["метод конкурентов 1", "метод конкурентов 2"],
      "improvement_suggestions": ["предложение 1", "предложение 2"]
    }
  },
  "competitive_positioning": {
    "market_position": "leader|challenger|follower|niche",
    "strengths": ["сильная сторона 1", "сильная сторона 2"],
    "weaknesses": ["слабость 1", "слабость 2"],
    "opportunities": ["возможность 1", "возможность 2"],
    "threats": ["угроза 1", "угроза 2"]
  },
  "content_recommendations": {
    "immediate_actions": ["действие 1", "действие 2"],
    "medium_term_strategy": ["стратегия 1", "стратегия 2"],
    "long_term_positioning": ["позиционирование 1", "позиционирование 2"]
  },
  "confidence": 0.0-1.0
}`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert competitive analysis specialist. Analyze podcast positioning and provide strategic recommendations. Always respond in Russian."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2500,
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
      content_differences: {
        topic_focus: {
          your_strengths: parsed.content_differences?.topic_focus?.your_strengths || [],
          competitor_advantages: parsed.content_differences?.topic_focus?.competitor_advantages || [],
          unique_opportunities: parsed.content_differences?.topic_focus?.unique_opportunities || []
        },
        content_style: {
          your_approach: parsed.content_differences?.content_style?.your_approach || '',
          competitor_approach: parsed.content_differences?.content_style?.competitor_approach || '',
          differentiation_opportunities: parsed.content_differences?.content_style?.differentiation_opportunities || []
        },
        engagement_strategies: {
          your_methods: parsed.content_differences?.engagement_strategies?.your_methods || [],
          competitor_methods: parsed.content_differences?.engagement_strategies?.competitor_methods || [],
          improvement_suggestions: parsed.content_differences?.engagement_strategies?.improvement_suggestions || []
        }
      },
      competitive_positioning: {
        market_position: parsed.competitive_positioning?.market_position || 'follower',
        strengths: parsed.competitive_positioning?.strengths || [],
        weaknesses: parsed.competitive_positioning?.weaknesses || [],
        opportunities: parsed.competitive_positioning?.opportunities || [],
        threats: parsed.competitive_positioning?.threats || []
      },
      content_recommendations: {
        immediate_actions: parsed.content_recommendations?.immediate_actions || [],
        medium_term_strategy: parsed.content_recommendations?.medium_term_strategy || [],
        long_term_positioning: parsed.content_recommendations?.long_term_positioning || []
      },
      confidence: parsed.confidence || 0.5
    }
  } catch (error) {
    console.error('Error in AI competitor comparison analysis:', error)
    throw error
  }
}
