import { NextRequest, NextResponse } from 'next/server'
import { getCharts } from '@/lib/services/charts'
import { saveChartPositions } from '@/lib/services/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') as 'spotify' | 'apple' || 'apple'
    const category = searchParams.get('category') || '1310'
    const limit = parseInt(searchParams.get('limit') || '50')
    const country = searchParams.get('country') || (platform === 'apple' ? 'ru' : 'US')

    // Получаем чарты
    const charts = await getCharts(platform, category, limit, country)

    // Сохраняем позиции в БД
    try {
      const chartPositions = []
      
      for (let i = 0; i < charts.length; i++) {
        const chart = charts[i]
        
        // Сначала находим или создаем подкаст в БД
        const { getPodcastBySource, savePodcast } = await import('@/lib/services/database')
        
        let podcast = await getPodcastBySource(chart.source, chart.source_id)
        
        if (!podcast) {
          // Создаем подкаст если его нет
          podcast = await savePodcast({
            source: chart.source,
            source_id: chart.source_id,
            title: chart.title,
            author: chart.author,
            description: chart.description,
            image_url: chart.image_url,
            category: chart.category,
            rss_url: chart.rss_url,
          })
        }
        
        chartPositions.push({
          podcast_id: podcast.id, // Используем UUID из БД
          platform: chart.source,
          category: chart.category || 'General',
          position: i + 1,
          date: new Date().toISOString().split('T')[0],
        })
      }

      await saveChartPositions(chartPositions)
    } catch (error) {
      console.error('Error saving chart positions:', error)
      // Продолжаем без сохранения
    }

    return NextResponse.json({ charts })
  } catch (error) {
    console.error('Get charts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
