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
export async function searchPodcasts(query: string, limit = 20) {
  try {
    await getAccessToken()
    
    // Добавляем параметр языка для получения английских результатов
    const data = await spotifyApi.search(query, ['show'], { 
      limit,
      market: 'US' // Принудительно используем US рынок для английских результатов
    })
    
    return data.body.shows?.items.map(show => ({
      id: show.id,
      source: 'spotify' as const,
      source_id: show.id,
      title: show.name,
      author: show.publisher,
      description: show.description,
      image_url: show.images?.[0]?.url,
      category: show.genres?.[0],
      rss_url: show.external_urls?.spotify,
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
      category: show.genres?.[0],
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
    
    return data.body.items.map(episode => ({
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
    
    return data.body.categories.items.map(category => ({
      id: category.id,
      name: category.name,
    }))
  } catch (error) {
    console.error('Error getting Spotify categories:', error)
    throw new Error('Failed to get Spotify categories')
  }
}
