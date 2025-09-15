import { NextRequest, NextResponse } from 'next/server'
import { searchPodcasts as searchSpotifyPodcasts } from '@/lib/services/spotify'
import { searchPodcasts as searchApplePodcasts } from '@/lib/services/apple'
import { savePodcast, getPodcastBySource } from '@/lib/services/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const platform = searchParams.get('platform') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    let results: any[] = []

    // Поиск в Spotify
    if (platform === 'all' || platform === 'spotify') {
      try {
        const spotifyResults = await searchSpotifyPodcasts(query, limit)
        results = [...results, ...spotifyResults]
      } catch (error) {
        console.error('Spotify search error:', error)
        // Продолжаем без Spotify результатов
      }
    }

    // Поиск в Apple Podcasts
    if (platform === 'all' || platform === 'apple') {
      try {
        const appleResults = await searchApplePodcasts(query, limit)
        results = [...results, ...appleResults]
      } catch (error) {
        console.error('Apple search error:', error)
        // Продолжаем без Apple результатов
      }
    }

    // Сохраняем найденные подкасты в БД
    for (const podcast of results) {
      try {
        const existingPodcast = await getPodcastBySource(podcast.source, podcast.source_id)
        if (!existingPodcast) {
          await savePodcast(podcast)
        }
      } catch (error) {
        console.error('Error saving podcast:', error)
        // Продолжаем без сохранения
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
