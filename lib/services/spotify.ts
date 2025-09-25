import SpotifyWebApi from 'spotify-web-api-node'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
})

// Получение access token
async function getAccessToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant()
    spotifyApi.setAccessToken(data.body.access_token)
    return data.body.access_token
  } catch (error) {
    console.error('Error getting Spotify access token:', error)
    throw new Error('Failed to get Spotify access token')
  }
}

// Поиск подкастов
export async function searchPodcasts(query: string, limit = 20, country: string = 'US') {
  try {
    await getAccessToken()
    
    // Используем прямые HTTP запросы для лучшего контроля над параметрами
    const accessToken = spotifyApi.getAccessToken()
    if (!accessToken) {
      throw new Error('No access token available')
    }
    
    // Кодируем запрос для URL
    const encodedQuery = encodeURIComponent(query)
    
    // Делаем прямой запрос к Spotify API с принудительными параметрами
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodedQuery}&type=show&limit=${limit}&market=${country}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept-Language': 'en-US,en;q=0.9', // Принудительно английский язык
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'X-Forwarded-For': '8.8.8.8', // Принудительно US IP
          'CF-IPCountry': 'US' // Cloudflare country header
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return data.shows?.items.map((show: { id: string; name: string; description: string; images: Array<{ url: string }>; publisher: string; genres?: string[]; external_urls?: { spotify: string } }) => ({
      id: show.id,
      source: 'spotify' as const,
      source_id: show.id,
      title: show.name,
      author: show.publisher,
      description: show.description,
      image_url: show.images?.[0]?.url,
      category: show.genres?.[0],
      rss_url: show.external_urls?.spotify,
      // Добавляем флаг для определения языка
      isEnglish: /^[a-zA-Z0-9\s\-_.,!?]+$/.test(show.name) && /^[a-zA-Z0-9\s\-_.,!?]+$/.test(show.publisher || '')
    })) || []
  } catch (error) {
    console.error('Error searching Spotify podcasts:', error)
    throw new Error('Failed to search Spotify podcasts')
  }
}

// Получение детальной информации о подкасте
export async function getPodcastDetails(showId: string) {
  try {
    await getAccessToken()
    
    const data = await spotifyApi.getShow(showId)
    const show = data.body
    
    return {
      id: show.id,
      source: 'spotify' as const,
      source_id: show.id,
      title: show.name,
      author: show.publisher,
      description: show.description,
      image_url: show.images?.[0]?.url,
      category: (show as any).genres?.[0],
      rss_url: show.external_urls?.spotify,
      total_episodes: show.total_episodes,
      languages: show.languages,
      explicit: show.explicit,
    }
  } catch (error) {
    console.error('Error getting Spotify podcast details:', error)
    throw new Error('Failed to get Spotify podcast details')
  }
}

// Получение эпизодов подкаста
export async function getPodcastEpisodes(showId: string, limit = 50) {
  try {
    await getAccessToken()
    
    const data = await spotifyApi.getShowEpisodes(showId, { limit })
    
    return data.body.items.map((episode: { id: string; name: string; description: string; release_date: string; duration_ms: number; external_urls: { spotify: string }; images?: Array<{ url: string }> }) => ({
      id: episode.id,
      title: episode.name,
      description: episode.description,
      published_at: episode.release_date,
      duration: episode.duration_ms ? Math.floor(episode.duration_ms / 1000) : undefined,
      audio_url: episode.external_urls?.spotify,
      image_url: episode.images?.[0]?.url,
    }))
  } catch (error) {
    console.error('Error getting Spotify podcast episodes:', error)
    throw new Error('Failed to get Spotify podcast episodes')
  }
}

// Получение категорий подкастов
export async function getPodcastCategories() {
  try {
    await getAccessToken()
    
    const data = await spotifyApi.getCategories()
    
    return data.body.categories.items.map((category: { id: string; name: string }) => ({
      id: category.id,
      name: category.name,
    }))
  } catch (error) {
    console.error('Error getting Spotify categories:', error)
    throw new Error('Failed to get Spotify categories')
  }
}
