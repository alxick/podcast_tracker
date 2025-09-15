import { NextRequest, NextResponse } from 'next/server'
import { getCharts } from '@/lib/services/charts'
import { saveChartPositions } from '@/lib/services/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') as 'spotify' | 'apple' || 'apple'
    const category = searchParams.get('category') || '1310'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Получаем чарты
    const charts = await getCharts(platform, category, limit)

    // Сохраняем позиции в БД
    try {
      const chartPositions = charts.map((chart, index) => ({
        podcast_id: chart.id,
        platform: chart.source,
        category: chart.category || 'General',
        position: index + 1,
        date: new Date().toISOString().split('T')[0],
      }))

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
