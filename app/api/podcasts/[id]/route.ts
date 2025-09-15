import { NextRequest, NextResponse } from 'next/server'
import { getPodcast, getPodcastBySource } from '@/lib/services/database'
import { getPodcastDetails as getSpotifyDetails, getPodcastEpisodes as getSpotifyEpisodes } from '@/lib/services/spotify'
import { getPodcastDetails as getAppleDetails, getPodcastEpisodes as getAppleEpisodes } from '@/lib/services/apple'
import { saveEpisodes } from '@/lib/services/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const includeEpisodes = searchParams.get('episodes') === 'true'

    // Получаем подкаст из БД
    let podcast = await getPodcast(id)

    // Если подкаст не найден в БД, пытаемся найти по source_id
    if (!podcast) {
      // Предполагаем, что id может быть source_id
      const spotifyPodcast = await getPodcastBySource('spotify', id)
      const applePodcast = await getPodcastBySource('apple', id)
      
      podcast = spotifyPodcast || applePodcast
    }

    if (!podcast) {
      return NextResponse.json(
        { error: 'Podcast not found' },
        { status: 404 }
      )
    }

    let episodes = []

    // Получаем эпизоды если запрошены
    if (includeEpisodes) {
      try {
        if (podcast.source === 'spotify') {
          episodes = await getSpotifyEpisodes(podcast.source_id)
        } else if (podcast.source === 'apple' && podcast.rss_url) {
          episodes = await getAppleEpisodes(podcast.rss_url)
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
        console.error('Error getting episodes:', error)
        // Возвращаем подкаст без эпизодов
      }
    }

    return NextResponse.json({
      podcast,
      episodes: includeEpisodes ? episodes : undefined,
    })
  } catch (error) {
    console.error('Get podcast error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
