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
    
    if (!data.feed?.entry) {
      return []
    }
    
    return data.feed.entry.map((entry: {
      id: { attributes: { 'im:id': string } }
      'im:name': { label: string }
      'im:artist': { label: string }
      summary?: { label: string }
      'im:image': Array<{ label: string }>
      category: { attributes: { label: string } }
      link: { attributes: { href: string } }
    }, index: number) => ({
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

// Получение топ-чартов Spotify (mock данные)
export async function getSpotifyCharts(limit = 50) {
  try {
    // Spotify не предоставляет публичные чарты подкастов
    // Возвращаем популярные подкасты для демонстрации
    const popularPodcasts = [
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
      {
        id: 'spotify_3',
        source: 'spotify' as const,
        source_id: 'spotify_3',
        title: 'Crime Junkie',
        author: 'audiochuck',
        description: 'If you can never get enough true crime... Congratulations, you\'ve found your people.',
        image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
        category: 'True Crime',
        position: 3,
        rss_url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
      },
      {
        id: 'spotify_4',
        source: 'spotify' as const,
        source_id: 'spotify_4',
        title: 'The Daily',
        author: 'The New York Times',
        description: 'Twenty minutes a day, five days a week, hosted by Michael Barbaro and powered by New York Times journalism.',
        image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
        category: 'News',
        position: 4,
        rss_url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
      },
      {
        id: 'spotify_5',
        source: 'spotify' as const,
        source_id: 'spotify_5',
        title: 'This American Life',
        author: 'This American Life',
        description: 'This American Life is a weekly public radio show, hosted by Ira Glass.',
        image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
        category: 'Society & Culture',
        position: 5,
        rss_url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
      },
      {
        id: 'spotify_6',
        source: 'spotify' as const,
        source_id: 'spotify_6',
        title: 'Stuff You Should Know',
        author: 'iHeartPodcasts',
        description: 'If you\'ve ever wanted to know about champagne, satanism, the Stonewall Uprising, chaos theory, LSD, El Nino, true crime and Rosa Parks, then look no further.',
        image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
        category: 'Education',
        position: 6,
        rss_url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
      },
      {
        id: 'spotify_7',
        source: 'spotify' as const,
        source_id: 'spotify_7',
        title: 'TED Talks Daily',
        author: 'TED',
        description: 'Every weekday, TED Talks Daily brings you the latest talks in audio.',
        image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
        category: 'Education',
        position: 7,
        rss_url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
      },
      {
        id: 'spotify_8',
        source: 'spotify' as const,
        source_id: 'spotify_8',
        title: 'The Tim Ferriss Show',
        author: 'Tim Ferriss',
        description: 'The Tim Ferriss Show focuses on deconstructing world-class performers from eclectic areas.',
        image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
        category: 'Business',
        position: 8,
        rss_url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
      },
      {
        id: 'spotify_9',
        source: 'spotify' as const,
        source_id: 'spotify_9',
        title: 'Serial',
        author: 'Serial Productions',
        description: 'Serial is a podcast from the creators of This American Life.',
        image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
        category: 'True Crime',
        position: 9,
        rss_url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
      },
      {
        id: 'spotify_10',
        source: 'spotify' as const,
        source_id: 'spotify_10',
        title: 'Fresh Air',
        author: 'NPR',
        description: 'Fresh Air from WHYY, the Peabody Award-winning weekday magazine of contemporary arts and issues.',
        image_url: 'https://i.scdn.co/image/ab6765630000ba8a81f07e1ead0317ee3c285bfa',
        category: 'Society & Culture',
        position: 10,
        rss_url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
      },
    ]
    
    // Возвращаем только запрошенное количество
    return popularPodcasts.slice(0, limit)
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
