import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionLimits } from '@/lib/middleware/subscription-limits'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Проверяем, что пользователь имеет доступ к экспорту
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Только платные планы могут экспортировать данные
    if (!['starter', 'pro', 'agency'].includes(userData.plan)) {
      return NextResponse.json(
        { error: 'Export feature requires a paid plan' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'podcasts'

    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported: csv, json' },
        { status: 400 }
      )
    }

    if (!['podcasts', 'charts', 'episodes'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Supported: podcasts, charts, episodes' },
        { status: 400 }
      )
    }

    let data: any[] = []
    let filename = ''

    if (type === 'podcasts') {
      // Экспорт отслеживаемых подкастов
      const { data: userPodcasts, error: podcastsError } = await supabase
        .from('user_podcasts')
        .select(`
          podcasts!inner(
            title,
            author,
            description,
            category,
            source,
            image_url,
            created_at
          )
        `)
        .eq('user_id', user.id)

      if (podcastsError) {
        return NextResponse.json(
          { error: 'Failed to fetch podcasts' },
          { status: 500 }
        )
      }

      data = userPodcasts.map(up => ({
        title: up.podcasts?.[0]?.title || '',
        author: up.podcasts?.[0]?.author || '',
        description: up.podcasts?.[0]?.description || '',
        category: up.podcasts?.[0]?.category || '',
        source: up.podcasts?.[0]?.source || '',
        image_url: up.podcasts?.[0]?.image_url || '',
        created_at: up.podcasts?.[0]?.created_at || ''
      }))
      filename = 'my-podcasts'

    } else if (type === 'charts') {
      // Экспорт данных чартов для отслеживаемых подкастов
      const { data: charts, error: chartsError } = await supabase
        .from('charts')
        .select(`
          position,
          platform,
          category,
          date,
          podcasts!inner(
            title,
            user_podcasts!inner(user_id)
          )
        `)
        .eq('podcasts.user_podcasts.user_id', user.id)
        .order('date', { ascending: false })
        .limit(1000)

      if (chartsError) {
        return NextResponse.json(
          { error: 'Failed to fetch charts data' },
          { status: 500 }
        )
      }

      data = charts.map(chart => ({
        podcast_title: chart.podcasts?.[0]?.title || '',
        position: chart.position,
        platform: chart.platform,
        category: chart.category,
        date: chart.date
      }))
      filename = 'charts-data'

    } else if (type === 'episodes') {
      // Экспорт эпизодов для отслеживаемых подкастов
      const { data: episodes, error: episodesError } = await supabase
        .from('episodes')
        .select(`
          title,
          description,
          published_at,
          duration,
          podcasts!inner(
            title,
            user_podcasts!inner(user_id)
          )
        `)
        .eq('podcasts.user_podcasts.user_id', user.id)
        .order('published_at', { ascending: false })
        .limit(1000)

      if (episodesError) {
        return NextResponse.json(
          { error: 'Failed to fetch episodes data' },
          { status: 500 }
        )
      }

      data = episodes.map(episode => ({
        podcast_title: episode.podcasts?.[0]?.title || '',
        episode_title: episode.title,
        description: episode.description,
        published_at: episode.published_at,
        duration: episode.duration
      }))
      filename = 'episodes-data'
    }

    if (format === 'csv') {
      // Конвертируем в CSV
      const csv = convertToCSV(data)
      const headers = new Headers()
      headers.set('Content-Type', 'text/csv')
      headers.set('Content-Disposition', `attachment; filename="${filename}.csv"`)
      
      return new NextResponse(csv, { headers })
    } else {
      // JSON формат
      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('Content-Disposition', `attachment; filename="${filename}.json"`)
      
      return new NextResponse(JSON.stringify(data, null, 2), { headers })
    }

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Конвертация данных в CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || ''
      // Экранируем кавычки и запятые
      return `"${String(value).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}
