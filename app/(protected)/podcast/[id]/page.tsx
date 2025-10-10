'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import { Podcast, Episode } from '@/lib/types/database'
import { ChartGraph } from '@/components/podcast/ChartGraph'
import { EpisodesList } from '@/components/podcast/EpisodesList'
import { TrendAnalysis } from '@/components/podcast/TrendAnalysis'
import { AIAnalysis } from '@/components/podcast/AIAnalysis'
import { AdvancedAIAnalysis } from '@/components/podcast/AdvancedAIAnalysis'
import { QualityMonitoring } from '@/components/podcast/QualityMonitoring'

export default function PodcastDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    if (user && params.id) {
      loadPodcastData()
    }
  }, [user, params.id])

  const loadPodcastData = async () => {
    try {
      // Загружаем детали подкаста
      const podcastResponse = await fetch(`/api/podcasts/${params.id}`)
      if (podcastResponse.ok) {
        const podcastData = await podcastResponse.json()
        setPodcast(podcastData.podcast)
      }

      // Загружаем эпизоды
      const episodesResponse = await fetch(`/api/podcasts/${params.id}/episodes?refresh=true`)
      if (episodesResponse.ok) {
        const episodesData = await episodesResponse.json()
        setEpisodes(episodesData.episodes)
      }

      // Проверяем, отслеживается ли подкаст
      const trackingResponse = await fetch('/api/user/podcasts')
      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json()
        const trackingIds = trackingData.podcasts.map((p: { podcast_id: string }) => p.podcast_id)
        setIsTracking(trackingIds.includes(params.id))
      }
    } catch (error) {
      console.error('Error loading podcast data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTracking = async () => {
    if (!podcast) return

    try {
      if (isTracking) {
        const response = await fetch(`/api/user/podcasts?podcastId=${podcast.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setIsTracking(false)
        }
      } else {
        const response = await fetch('/api/user/podcasts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ podcastId: podcast.id }),
        })
        if (response.ok) {
          setIsTracking(true)
        }
      }
    } catch (error) {
      console.error('Error toggling tracking:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка подкаста...</p>
        </div>
      </div>
    )
  }

  if (!podcast) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Подкаст не найден</h1>
          <Button onClick={() => router.push('/search')}>
            Вернуться к поиску
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Шапка подкаста */}
      <div className="mb-8">
        <div className="flex gap-6">
          <div className="flex-shrink-0">
            {podcast.image_url ? (
              <Image
                src={podcast.image_url}
                alt={podcast.title}
                width={200}
                height={200}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-50 h-50 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Нет фото</span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{podcast.title}</h1>
                <p className="text-xl text-gray-600 mb-4">{podcast.author}</p>
                <div className="flex gap-2 mb-4">
                  <Badge variant="outline">
                    {podcast.source === 'spotify' ? 'Spotify' : 'Apple Podcasts'}
                  </Badge>
                  {podcast.category && (
                    <Badge variant="outline">{podcast.category}</Badge>
                  )}
                </div>
              </div>
              
              <Button
                onClick={handleToggleTracking}
                variant={isTracking ? 'outline' : 'default'}
              >
                {isTracking ? 'Удалить из отслеживания' : 'Добавить в отслеживание'}
              </Button>
            </div>
            
            {podcast.description && (
              <p className="text-gray-700 leading-relaxed">{podcast.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Табы с контентом */}
      <Tabs defaultValue="episodes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="episodes">Эпизоды</TabsTrigger>
          <TabsTrigger value="charts">Позиции в чартах</TabsTrigger>
          <TabsTrigger value="analysis">AI-анализ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="episodes">
          <EpisodesList episodes={episodes} podcastId={podcast.id} />
        </TabsContent>
        
        <TabsContent value="charts">
          <ChartGraph podcastId={podcast.id} />
        </TabsContent>
        
        <TabsContent value="analysis">
          <div className="space-y-6">
            <AIAnalysis podcastId={podcast.id} podcastTitle={podcast.title} />
            <TrendAnalysis podcast={podcast} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdvancedAIAnalysis podcast={podcast} />
              <QualityMonitoring podcast={podcast} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
