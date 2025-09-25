import { getCharts } from '@/lib/services/charts'
import { saveChartPositions, getPodcastChartHistory } from '@/lib/services/database'

// Обновление чартов
export async function updateCharts() {
  console.log('Starting charts update...')
  
  try {
    // Обновляем Apple Podcasts чарты для основных категорий
    const appleCategories = ['1310', '1302', '1303', '1304', '1307', '1315']
    
    for (const category of appleCategories) {
      try {
        console.log(`Updating Apple charts for category ${category}`)
        const charts = await getCharts('apple', category, 50)
        
        if (charts.length > 0) {
          const chartPositions = charts.map((chart: { id: string; category?: string }, index: number) => ({
            podcast_id: chart.id,
            platform: 'apple' as const,
            category: chart.category || 'General',
            position: index + 1,
            date: new Date().toISOString().split('T')[0],
          }))
          
          await saveChartPositions(chartPositions)
          console.log(`Updated ${charts.length} Apple chart positions for category ${category}`)
        }
      } catch (error) {
        console.error(`Error updating Apple charts for category ${category}:`, error)
      }
    }
    
    // Обновляем Spotify чарты
    try {
      console.log('Updating Spotify charts')
      const charts = await getCharts('spotify', undefined, 50)
      
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
    // Здесь нужно получить все отслеживаемые подкасты
    // и обновить их эпизоды
    // Пока что это заглушка
    
    console.log('Episodes update completed')
  } catch (error) {
    console.error('Error in episodes update:', error)
  }
}

// Основная функция cron-job
export async function runCronJob() {
  console.log('Starting cron job...')
  
  try {
    await updateCharts()
    await updateEpisodes()
    
    console.log('Cron job completed successfully')
  } catch (error) {
    console.error('Cron job failed:', error)
  }
}
