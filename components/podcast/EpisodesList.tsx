'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Episode } from '@/lib/types/database'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface EpisodesListProps {
  episodes: Episode[]
}

export function EpisodesList({ episodes }: EpisodesListProps) {
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
    <Card>
      <CardHeader>
        <CardTitle>Последние эпизоды</CardTitle>
        <CardDescription>
          {episodes.length} эпизодов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {episodes.map((episode) => (
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
  )
}
