'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Podcast } from '@/lib/types/database'
import Image from 'next/image'

interface SearchResultsProps {
  results: Podcast[]
  loading: boolean
  onAddPodcast: (podcastId: string) => Promise<void>
  onRemovePodcast: (podcastId: string) => Promise<void>
  trackingPodcasts: string[]
}

export function SearchResults({ 
  results, 
  loading, 
  onAddPodcast, 
  onRemovePodcast, 
  trackingPodcasts 
}: SearchResultsProps) {
  const [addingPodcasts, setAddingPodcasts] = useState<Set<string>>(new Set())

  const handleAddPodcast = async (podcastId: string) => {
    setAddingPodcasts(prev => new Set(prev).add(podcastId))
    try {
      await onAddPodcast(podcastId)
    } finally {
      setAddingPodcasts(prev => {
        const newSet = new Set(prev)
        newSet.delete(podcastId)
        return newSet
      })
    }
  }

  const handleRemovePodcast = async (podcastId: string) => {
    setAddingPodcasts(prev => new Set(prev).add(podcastId))
    try {
      await onRemovePodcast(podcastId)
    } finally {
      setAddingPodcasts(prev => {
        const newSet = new Set(prev)
        newSet.delete(podcastId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Поиск подкастов...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Подкасты не найдены</p>
            <p className="text-sm">Попробуйте изменить поисковый запрос</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Результаты поиска</h3>
        <Badge variant="secondary">{results.length} найдено</Badge>
      </div>
      
      <div className="grid gap-4">
        {results.map((podcast) => {
          const isTracking = trackingPodcasts.includes(podcast.id)
          const isAdding = addingPodcasts.has(podcast.id)
          
          return (
            <Card key={podcast.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {podcast.image_url ? (
                      <Image
                        src={podcast.image_url}
                        alt={podcast.title}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Нет фото</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg truncate">{podcast.title}</h4>
                        <p className="text-sm text-gray-600 truncate">{podcast.author}</p>
                        {podcast.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {podcast.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {podcast.source === 'spotify' ? 'Spotify' : 'Apple Podcasts'}
                          </Badge>
                          {podcast.category && (
                            <Badge variant="outline" className="text-xs">
                              {podcast.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-4">
                        {isTracking ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemovePodcast(podcast.id)}
                            disabled={isAdding}
                          >
                            {isAdding ? 'Удаление...' : 'Удалить'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddPodcast(podcast.id)}
                            disabled={isAdding}
                          >
                            {isAdding ? 'Добавление...' : 'Добавить'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
