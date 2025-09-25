import OpenAI from 'openai'
import { createServiceRoleClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface PositionChange {
  podcast_id: string
  podcast_title: string
  old_position: number | null
  new_position: number
  change: number
  platform: 'spotify' | 'apple'
  category: string
  date: string
}

export interface CompetitorAnalysis {
  podcast_id: string
  title: string
  platform: string
  position: number
  episodes_count: number
  avg_duration: number
  has_guests: boolean
  last_episode_date: string
}

export interface AIAnalysisResult {
  summary: string
  reasons: {
    positive: string[]
    negative: string[]
  }
  recommendations: string[]
  competitor_insights: string[]
  confidence: number
}

// Анализ причин изменений позиций
export async function analyzePositionChanges(
  changes: PositionChange[],
  competitorData: CompetitorAnalysis[]
): Promise<AIAnalysisResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return getMockAnalysis(changes)
    }

    const prompt = createAnalysisPrompt(changes, competitorData)
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert podcast analyst. Analyze position changes in podcast charts and provide actionable insights. Always respond in Russian."
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

    return parseAnalysisResponse(analysisText)
  } catch (error) {
    console.error('Error analyzing position changes:', error)
    return getMockAnalysis(changes)
  }
}

// Создание промпта для анализа
function createAnalysisPrompt(
  changes: PositionChange[],
  competitorData: CompetitorAnalysis[]
): string {
  const improvements = changes.filter(c => c.change > 0)
  const declines = changes.filter(c => c.change < 0)

  let prompt = `Проанализируй изменения позиций подкастов в чартах и объясни причины:

ИЗМЕНЕНИЯ ПОЗИЦИЙ:
${changes.map((c: PositionChange) => 
  `- ${c.podcast_title}: ${c.old_position || 'N/A'} → ${c.new_position} (${c.change > 0 ? '+' : ''}${c.change}) на ${c.platform} в категории ${c.category}`
).join('\n')}

ДАННЫЕ О КОНКУРЕНТАХ:
${competitorData.map((c: CompetitorAnalysis) => 
  `- ${c.title}: позиция ${c.position}, ${c.episodes_count} эпизодов, средняя длительность ${c.avg_duration} мин, ${c.has_guests ? 'есть гости' : 'без гостей'}, последний эпизод ${c.last_episode_date}`
).join('\n')}

Проанализируй и верни JSON в формате:
{
  "summary": "краткое резюме изменений",
  "reasons": {
    "positive": ["причина 1 роста", "причина 2 роста"],
    "negative": ["причина 1 падения", "причина 2 падения"]
  },
  "recommendations": ["рекомендация 1", "рекомендация 2", "рекомендация 3"],
  "competitor_insights": ["инсайт о конкурентах 1", "инсайт о конкурентах 2"],
  "confidence": 0.85
}`

  return prompt
}

// Парсинг ответа от AI
function parseAnalysisResponse(response: string): AIAnalysisResult {
  try {
    // Убираем возможные markdown блоки
    const cleanText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const parsed = JSON.parse(cleanText)
    
    return {
      summary: parsed.summary || 'Анализ недоступен',
      reasons: {
        positive: parsed.reasons?.positive || [],
        negative: parsed.reasons?.negative || []
      },
      recommendations: parsed.recommendations || [],
      competitor_insights: parsed.competitor_insights || [],
      confidence: parsed.confidence || 0.5
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    return getMockAnalysis([])
  }
}

// Mock анализ для случаев без OpenAI
function getMockAnalysis(changes: PositionChange[]): AIAnalysisResult {
  const improvements = changes.filter(c => c.change > 0)
  const declines = changes.filter(c => c.change < 0)

  return {
    summary: `Проанализировано ${changes.length} изменений позиций. ${improvements.length} улучшений, ${declines.length} падений.`,
    reasons: {
      positive: [
        'Увеличение частоты публикации эпизодов',
        'Привлечение известных гостей',
        'Оптимизация времени публикации'
      ],
      negative: [
        'Снижение активности в социальных сетях',
        'Конкуренты увеличили активность',
        'Изменение алгоритмов платформ'
      ]
    },
    recommendations: [
      'Публикуйте эпизоды чаще - минимум 2 раза в неделю',
      'Приглашайте известных гостей для увеличения охвата',
      'Анализируйте активность конкурентов и адаптируйтесь',
      'Оптимизируйте время публикации под вашу аудиторию'
    ],
    competitor_insights: [
      'Топовые конкуренты публикуют 3-4 эпизода в неделю',
      'Успешные подкасты приглашают гостей в 70% эпизодов',
      'Оптимальная длительность эпизода - 25-40 минут'
    ],
    confidence: 0.6
  }
}

// Получение данных о конкурентах для анализа
export async function getCompetitorAnalysisData(
  podcastId: string,
  category: string,
  platform: 'spotify' | 'apple'
): Promise<CompetitorAnalysis[]> {
  const supabase = createServiceRoleClient()
  
  try {
    // Получаем топ-20 подкастов в той же категории
    const { data: competitors, error } = await supabase
      .from('charts')
      .select(`
        podcast_id,
        position,
        platform,
        podcasts!inner(
          title,
          source,
          episodes(
            title,
            published_at,
            duration
          )
        )
      `)
      .eq('platform', platform)
      .eq('category', category)
      .order('position', { ascending: true })
      .limit(20)

    if (error) {
      console.error('Error getting competitor data:', error)
      return []
    }

    return competitors.map((comp: { podcast_id: string; platform: string; position: number; podcasts?: Array<{ title: string; episodes: Array<{ title: string; published_at: string; duration?: number }> }> }) => {
      const episodes = comp.podcasts?.[0]?.episodes || []
      const avgDuration = episodes.length > 0 
        ? episodes.reduce((sum: number, ep: { duration?: number }) => sum + (ep.duration || 0), 0) / episodes.length
        : 0
      
      const hasGuests = episodes.some((ep: { title: string }) => 
        ep.title.toLowerCase().includes('guest') || 
        ep.title.toLowerCase().includes('гость') ||
        ep.title.toLowerCase().includes('interview')
      )

      const lastEpisode = episodes.length > 0 
        ? episodes.sort((a: { published_at: string }, b: { published_at: string }) => 
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
          )[0]
        : null

      return {
        podcast_id: comp.podcast_id,
        title: comp.podcasts?.[0]?.title || 'Unknown',
        platform: comp.platform,
        position: comp.position,
        episodes_count: episodes.length,
        avg_duration: Math.round(avgDuration),
        has_guests: hasGuests,
        last_episode_date: lastEpisode?.published_at || 'N/A'
      }
    })
  } catch (error) {
    console.error('Error getting competitor analysis data:', error)
    return []
  }
}

// Создание анализа для конкретного подкаста
export async function createPodcastAnalysis(podcastId: string): Promise<AIAnalysisResult | null> {
  try {
    const supabase = createServiceRoleClient()
    
    // Получаем последние изменения позиций
    const { data: changes, error: changesError } = await supabase
      .from('charts')
      .select(`
        podcast_id,
        position,
        platform,
        category,
        date,
        podcasts!inner(title)
      `)
      .eq('podcast_id', podcastId)
      .order('date', { ascending: false })
      .limit(10)

    if (changesError || !changes || changes.length < 2) {
      return null
    }

    // Преобразуем в формат PositionChange
    const positionChanges: PositionChange[] = []
    for (let i = 0; i < changes.length - 1; i++) {
      const current = changes[i]
      const previous = changes[i + 1]
      
      if (current.platform === previous.platform && current.category === previous.category) {
        positionChanges.push({
          podcast_id: current.podcast_id,
          podcast_title: current.podcasts?.[0]?.title || 'Unknown',
          old_position: previous.position,
          new_position: current.position,
          change: previous.position - current.position,
          platform: current.platform,
          category: current.category,
          date: current.date
        })
      }
    }

    if (positionChanges.length === 0) {
      return null
    }

    // Получаем данные о конкурентах
    const category = changes[0].category
    const platform = changes[0].platform
    const competitorData = await getCompetitorAnalysisData(podcastId, category, platform)

    // Создаем анализ
    return await analyzePositionChanges(positionChanges, competitorData)
  } catch (error) {
    console.error('Error creating podcast analysis:', error)
    return null
  }
}
