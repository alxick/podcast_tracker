// Apple Podcasts API сервис
// Использует iTunes Search API и RSS фиды

// Поиск подкастов через iTunes Search API
export async function searchPodcasts(query: string, limit = 20) {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=${limit}&country=US`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch from iTunes API')
    }
    
    const data = await response.json()
    
    if (!data.results || !Array.isArray(data.results)) {
      return []
    }
    
    return data.results.map((result: {
      collectionId: number
      collectionName: string
      artistName: string
      collectionCensoredName: string
      artworkUrl600: string
      primaryGenreName: string
      feedUrl: string
      country: string
      releaseDate: string
    }) => ({
      id: result.collectionId.toString(),
      source: 'apple' as const,
      source_id: result.collectionId.toString(),
      title: result.collectionName,
      author: result.artistName,
      description: result.collectionCensoredName,
      image_url: result.artworkUrl600,
      category: result.primaryGenreName,
      rss_url: result.feedUrl,
      country: result.country,
      release_date: result.releaseDate,
    }))
  } catch (error) {
    console.error('Error searching Apple podcasts:', error)
    throw new Error('Failed to search Apple podcasts')
  }
}

// Получение детальной информации о подкасте
export async function getPodcastDetails(collectionId: string) {
  try {
    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${collectionId}&entity=podcast&country=US`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch podcast details from iTunes API')
    }
    
    const data = await response.json()
    
    if (data.resultCount === 0 || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
      throw new Error('Podcast not found')
    }
    
    const result = data.results[0] as {
      collectionId: number
      collectionName: string
      artistName: string
      collectionCensoredName: string
      artworkUrl600: string
      primaryGenreName: string
      feedUrl: string
      country: string
      releaseDate: string
      trackCount: number
      genres: string[]
    }
    
    return {
      id: result.collectionId.toString(),
      source: 'apple' as const,
      source_id: result.collectionId.toString(),
      title: result.collectionName,
      author: result.artistName,
      description: result.collectionCensoredName,
      image_url: result.artworkUrl600,
      category: result.primaryGenreName,
      rss_url: result.feedUrl,
      country: result.country,
      release_date: result.releaseDate,
      track_count: result.trackCount,
      genres: result.genres,
    }
  } catch (error) {
    console.error('Error getting Apple podcast details:', error)
    throw new Error('Failed to get Apple podcast details')
  }
}

// Получение эпизодов подкаста через RSS
export async function getPodcastEpisodes(rssUrl: string, limit = 50) {
  try {
    const response = await fetch(rssUrl)
    
    if (!response.ok) {
      throw new Error('Failed to fetch RSS feed')
    }
    
    const xmlText = await response.text()
    
    // Простой парсинг RSS (в продакшене лучше использовать специализированную библиотеку)
    const episodes = parseRSSFeed(xmlText, limit)
    
    return episodes
  } catch (error) {
    console.error('Error getting Apple podcast episodes:', error)
    throw new Error('Failed to get Apple podcast episodes')
  }
}

// Простой парсер RSS фида
function parseRSSFeed(xmlText: string, limit: number) {
  const episodes: Array<{
    id: string
    title: string
    description: string
    published_at: string
    duration?: number
    audio_url?: string
  }> = []
  
  // Находим все элементы <item>
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  let count = 0
  
  while ((match = itemRegex.exec(xmlText)) !== null && count < limit) {
    const itemXml = match[1]
    
    const title = extractXmlValue(itemXml, 'title')
    const description = extractXmlValue(itemXml, 'description')
    const pubDate = extractXmlValue(itemXml, 'pubDate')
    const enclosure = extractXmlValue(itemXml, 'enclosure')
    const duration = extractXmlValue(itemXml, 'itunes:duration')
    
    if (title) {
      episodes.push({
        id: `episode_${count}`,
        title: cleanText(title),
        description: cleanText(description || ''),
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        duration: parseDuration(duration || ''),
        audio_url: extractEnclosureUrl(enclosure || ''),
      })
      count++
    }
  }
  
  return episodes
}

// Вспомогательные функции для парсинга XML
function extractXmlValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Удаляем HTML теги
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function parseDuration(duration: string): number | undefined {
  if (!duration) return undefined
  
  // Парсим формат HH:MM:SS или MM:SS
  const parts = duration.split(':').map(Number)
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  
  return undefined
}

function extractEnclosureUrl(enclosure: string): string | undefined {
  if (!enclosure) return undefined
  
  const urlMatch = enclosure.match(/url="([^"]*)"/)
  return urlMatch ? urlMatch[1] : undefined
}

// Получение категорий подкастов
export async function getPodcastCategories() {
  try {
    const response = await fetch(
      'https://itunes.apple.com/us/rss/toppodcasts/limit=1/genre=1301/json'
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories from iTunes API')
    }
    
    const data = await response.json()
    
    // Возвращаем основные категории подкастов
    return [
      { id: '1301', name: 'Arts' },
      { id: '1302', name: 'Business' },
      { id: '1303', name: 'Comedy' },
      { id: '1304', name: 'Education' },
      { id: '1305', name: 'Games & Hobbies' },
      { id: '1306', name: 'Government & Organizations' },
      { id: '1307', name: 'Health' },
      { id: '1308', name: 'Kids & Family' },
      { id: '1309', name: 'Music' },
      { id: '1310', name: 'News & Politics' },
      { id: '1311', name: 'Religion & Spirituality' },
      { id: '1312', name: 'Science & Medicine' },
      { id: '1313', name: 'Society & Culture' },
      { id: '1314', name: 'Sports & Recreation' },
      { id: '1315', name: 'Technology' },
      { id: '1316', name: 'TV & Film' },
    ]
  } catch (error) {
    console.error('Error getting Apple categories:', error)
    throw new Error('Failed to get Apple categories')
  }
}
