// Сервис для работы с чартами подкастов

// Получение топ-чартов Apple Podcasts
export async function getAppleCharts(category: string = '1310', limit = 50) {
  try {
    const response = await fetch(
      `https://itunes.apple.com/us/rss/toppodcasts/limit=${limit}/genre=${category}/json`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch Apple charts')
    }
    
    const data = await response.json()
    
    return data.feed.entry.map((entry: any, index: number) => ({
      id: entry.id.attributes['im:id'],
      source: 'apple' as const,
      source_id: entry.id.attributes['im:id'],
      title: entry['im:name'].label,
      author: entry['im:artist'].label,
      description: entry.summary?.label,
      image_url: entry['im:image'][entry['im:image'].length - 1].label,
      category: entry.category.attributes.label,
      position: index + 1,
      rss_url: entry.link.attributes.href,
    }))
  } catch (error) {
    console.error('Error getting Apple charts:', error)
    throw new Error('Failed to get Apple charts')
  }
}

// Получение топ-чартов Spotify (парсинг веб-страницы)
export async function getSpotifyCharts(limit = 50) {
  try {
    // В реальном проекте здесь был бы парсинг Spotify Charts
    // Пока возвращаем mock данные
    return [
      {
        id: 'spotify_1',
        source: 'spotify' as const,
        source_id: 'spotify_1',
        title: 'The Joe Rogan Experience',
        author: 'Joe Rogan',
        description: 'The Joe Rogan Experience podcast is a long form conversation hosted by comedian Joe Rogan.',
        image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
        category: 'Comedy',
        position: 1,
        rss_url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
      },
      {
        id: 'spotify_2',
        source: 'spotify' as const,
        source_id: 'spotify_2',
        title: 'Call Her Daddy',
        author: 'Alex Cooper',
        description: 'Call Her Daddy is a podcast hosted by Alex Cooper.',
        image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
        category: 'Comedy',
        position: 2,
        rss_url: 'https://open.spotify.com/show/6kAsbP8pxwaU2kPibKTuDJ',
      },
    ]
  } catch (error) {
    console.error('Error getting Spotify charts:', error)
    throw new Error('Failed to get Spotify charts')
  }
}

// Получение чартов по платформе
export async function getCharts(platform: 'spotify' | 'apple', category?: string, limit = 50) {
  if (platform === 'apple') {
    return await getAppleCharts(category, limit)
  } else {
    return await getSpotifyCharts(limit)
  }
}

// Получение истории позиций подкаста в чартах
export async function getPodcastChartHistory(
  podcastId: string, 
  platform: 'spotify' | 'apple', 
  days = 30
) {
  try {
    // В реальном проекте здесь был бы запрос к БД для получения истории
    // Пока возвращаем mock данные
    const history = []
    const today = new Date()
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Генерируем случайную позицию для демонстрации
      const position = Math.floor(Math.random() * 50) + 1
      
      history.push({
        date: date.toISOString().split('T')[0],
        position,
        platform,
        category: 'Technology',
      })
    }
    
    return history
  } catch (error) {
    console.error('Error getting podcast chart history:', error)
    throw new Error('Failed to get podcast chart history')
  }
}
