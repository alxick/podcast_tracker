import { NextRequest, NextResponse } from 'next/server'
import { getPodcast, getPodcastEpisodes, getPodcastBySource } from '@/lib/services/database'
import { getPodcastEpisodes as getSpotifyEpisodes } from '@/lib/services/spotify'
import { getPodcastEpisodes as getAppleEpisodes } from '@/lib/services/apple'
import { saveEpisodes } from '@/lib/services/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const refresh = searchParams.get('refresh') === 'true'

    // Сначала пытаемся найти по source_id (чаще всего это source_id)
    let podcast = await getPodcastBySource('spotify', id)
    if (!podcast) {
      podcast = await getPodcastBySource('apple', id)
    }
    
    // Если не найден по source_id, пытаемся найти по UUID
    if (!podcast) {
      podcast = await getPodcast(id)
    }
    
    if (!podcast) {
      return NextResponse.json(
        { error: 'Podcast not found' },
        { status: 404 }
      )
    }

    let episodes = []

    // Если запрошено обновление или нет эпизодов в БД
    if (refresh || episodes.length === 0) {
      try {
        if (podcast.source === 'spotify') {
          episodes = await getSpotifyEpisodes(podcast.source_id, limit)
        } else if (podcast.source === 'apple' && podcast.rss_url) {
          episodes = await getAppleEpisodes(podcast.rss_url, limit)
        }

        // Сохраняем эпизоды в БД
        if (episodes.length > 0) {
          const episodesToSave = episodes.map(episode => ({
            podcast_id: podcast.id,
            title: episode.title,
            published_at: episode.published_at,
            duration: episode.duration,
            description: episode.description,
            audio_url: episode.audio_url,
          }))
          
          await saveEpisodes(episodesToSave)
        }
      } catch (error) {
        console.error('Error getting episodes from API:', error)
        // Продолжаем с эпизодами из БД
      }
    }

    // Если не удалось получить эпизоды из API, берем из БД
    if (episodes.length === 0) {
      episodes = await getPodcastEpisodes(id, limit)
    }

    return NextResponse.json({ episodes })
  } catch (error) {
    console.error('Get episodes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
