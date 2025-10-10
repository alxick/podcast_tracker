'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Episode } from '@/lib/types/database'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useState } from 'react'
import { ContentAnalysis } from './ContentAnalysis'
import { FileText } from 'lucide-react'

interface EpisodesListProps {
  episodes: Episode[]
  podcastId: string
}

export function EpisodesList({ episodes, podcastId }: EpisodesListProps) {
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Неизвестно'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`
    }
    return `${minutes}м`
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ru 
      })
    } catch {
      return 'Неизвестно'
    }
  }

  if (episodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Эпизоды не найдены</p>
            <p className="text-sm">Попробуйте обновить страницу</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Последние эпизоды</CardTitle>
        <CardDescription>
          {episodes.length} эпизодов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {episodes.map((episode: Episode) => (
            <div key={episode.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg mb-2 line-clamp-2">
                    {episode.title}
                  </h4>
                  
                  {episode.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {episode.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatDate(episode.published_at)}</span>
                    <span>{formatDuration(episode.duration)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedEpisode(episode)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Анализ
                  </Button>
                </div>
                
                {episode.audio_url && (
                  <div className="flex-shrink-0 ml-4">
                    <a
                      href={episode.audio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Слушать
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Модальное окно для анализа контента */}
    {selectedEpisode && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Анализ контента эпизода</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEpisode(null)}
              >
                ✕
              </Button>
            </div>
            <ContentAnalysis episode={selectedEpisode} podcastId={podcastId} />
          </div>
        </div>
      </div>
    )}
  </>
  )
}
