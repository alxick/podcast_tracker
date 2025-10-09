import { getCharts } from '@/lib/services/charts'
import { saveChartPositions, getPodcastChartHistory } from '@/lib/services/database'
import { processScheduledNotifications } from '@/lib/services/notifications'

// Обновление чартов
export async function updateCharts() {
  console.log('Starting charts update...')
  
  try {
    // Обновляем Apple Podcasts чарты для основных категорий
    const appleCategories = [
      { id: '1310', name: 'Technology' },
      { id: '1302', name: 'Business' },
      { id: '1303', name: 'Comedy' },
      { id: '1304', name: 'Education' },
      { id: '1307', name: 'Health & Fitness' },
      { id: '1315', name: 'News' },
      { id: '1301', name: 'Arts' },
      { id: '1305', name: 'Kids & Family' },
      { id: '1306', name: 'Music' },
      { id: '1308', name: 'Religion & Spirituality' },
      { id: '1309', name: 'Science' },
      { id: '1311', name: 'Society & Culture' },
      { id: '1312', name: 'Sports' },
      { id: '1313', name: 'TV & Film' },
      { id: '1314', name: 'True Crime' }
    ]
    
    for (const category of appleCategories) {
      try {
        console.log(`Updating Apple charts for category ${category.name} (${category.id})`)
        const charts = await getCharts('apple', category.id, 100)
        
        if (charts.length > 0) {
          const chartPositions = charts.map((chart: { id: string; category?: string }, index: number) => ({
            podcast_id: chart.id,
            platform: 'apple' as const,
            category: category.name,
            position: index + 1,
            date: new Date().toISOString().split('T')[0],
          }))
          
          await saveChartPositions(chartPositions)
          console.log(`Updated ${charts.length} Apple chart positions for category ${category.name}`)
        }
      } catch (error) {
        console.error(`Error updating Apple charts for category ${category.name}:`, error)
      }
    }
    
    // Обновляем Spotify чарты (если доступны)
    try {
      console.log('Updating Spotify charts')
      const charts = await getCharts('spotify', undefined, 100)
      
      if (charts.length > 0) {
        const chartPositions = charts.map((chart: { id: string; category?: string }, index: number) => ({
          podcast_id: chart.id,
          platform: 'spotify' as const,
          category: chart.category || 'General',
          position: index + 1,
          date: new Date().toISOString().split('T')[0],
        }))
        
        await saveChartPositions(chartPositions)
        console.log(`Updated ${charts.length} Spotify chart positions`)
      }
    } catch (error) {
      console.error('Error updating Spotify charts:', error)
    }
    
    console.log('Charts update completed')
  } catch (error) {
    console.error('Error in charts update:', error)
  }
}

// Обновление эпизодов для отслеживаемых подкастов
export async function updateEpisodes() {
  console.log('Starting episodes update...')
  
  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const { getSpotifyEpisodes, getAppleEpisodes } = await import('@/lib/services/spotify')
    const { getApplePodcastEpisodes } = await import('@/lib/services/apple')
    
    const supabase = createServiceRoleClient()
    
    // Получаем все отслеживаемые подкасты
    const { data: userPodcasts, error: podcastsError } = await supabase
      .from('user_podcasts')
      .select(`
        podcast_id,
        podcasts!inner(
          id,
          source,
          source_id,
          title
        )
      `)
      .limit(100) // Ограничиваем для производительности

    if (podcastsError) {
      console.error('Error getting user podcasts:', podcastsError)
      return
    }

    if (!userPodcasts || userPodcasts.length === 0) {
      console.log('No user podcasts to update')
      return
    }

    console.log(`Updating episodes for ${userPodcasts.length} podcasts`)

    for (const userPodcast of userPodcasts) {
      try {
        const podcast = userPodcast.podcasts?.[0]
        if (!podcast) continue

        console.log(`Updating episodes for ${podcast.title} (${podcast.source})`)

        let newEpisodes: any[] = []

        if (podcast.source === 'spotify') {
          newEpisodes = await getSpotifyEpisodes(podcast.source_id)
        } else if (podcast.source === 'apple') {
          newEpisodes = await getApplePodcastEpisodes(podcast.source_id)
        }

        if (newEpisodes.length > 0) {
          // Сохраняем новые эпизоды
          const episodesToInsert = newEpisodes.map(episode => ({
            podcast_id: podcast.id,
            title: episode.title,
            description: episode.description || '',
            published_at: episode.published_at,
            duration: episode.duration || 0,
            audio_url: episode.audio_url || '',
            image_url: episode.image_url || ''
          }))

          const { error: insertError } = await supabase
            .from('episodes')
            .upsert(episodesToInsert, {
              onConflict: 'podcast_id,title,published_at'
            })

          if (insertError) {
            console.error(`Error inserting episodes for ${podcast.title}:`, insertError)
          } else {
            console.log(`Updated ${episodesToInsert.length} episodes for ${podcast.title}`)
          }
        }

        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error updating episodes for podcast ${userPodcast.podcast_id}:`, error)
      }
    }
    
    console.log('Episodes update completed')
  } catch (error) {
    console.error('Error in episodes update:', error)
  }
}

// Основная функция cron-job
export async function runCronJob() {
  console.log('Starting cron job...')
  const startTime = Date.now()
  
  try {
    // Обновляем чарты
    await updateCharts()
    
    // Обновляем эпизоды
    await updateEpisodes()
    
    // Обрабатываем уведомления
    await processScheduledNotifications()
    
    const duration = Date.now() - startTime
    console.log(`Cron job completed successfully in ${duration}ms`)
  } catch (error) {
    console.error('Cron job failed:', error)
    throw error
  }
}

// Функция для обновления только чартов (для более частого запуска)
export async function runChartsUpdate() {
  console.log('Starting charts-only update...')
  
  try {
    await updateCharts()
    console.log('Charts update completed successfully')
  } catch (error) {
    console.error('Charts update failed:', error)
    throw error
  }
}

// Функция для обновления только эпизодов
export async function runEpisodesUpdate() {
  console.log('Starting episodes-only update...')
  
  try {
    await updateEpisodes()
    console.log('Episodes update completed successfully')
  } catch (error) {
    console.error('Episodes update failed:', error)
    throw error
  }
}

// Функция для обработки только уведомлений
export async function runNotificationsUpdate() {
  console.log('Starting notifications-only update...')
  
  try {
    await processScheduledNotifications()
    console.log('Notifications update completed successfully')
  } catch (error) {
    console.error('Notifications update failed:', error)
    throw error
  }
}
