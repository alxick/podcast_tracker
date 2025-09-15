'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

interface UserPodcast {
  id: string
  podcast_id: string
  podcasts: {
    id: string
    source: string
    source_id: string
    title: string
    author: string
    description: string
    image_url: string
    category: string
  }
}

export default function DashboardPage() {
  const [podcasts, setPodcasts] = useState<UserPodcast[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadUserPodcasts()
    }
  }, [user])

  const loadUserPodcasts = async () => {
    try {
      const response = await fetch('/api/user/podcasts')
      if (response.ok) {
        const data = await response.json()
        setPodcasts(data.podcasts)
      }
    } catch (error) {
      console.error('Error loading user podcasts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePodcast = async (podcastId: string) => {
    try {
      const response = await fetch(`/api/user/podcasts?podcastId=${podcastId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setPodcasts(prev => prev.filter(p => p.podcast_id !== podcastId))
      }
    } catch (error) {
      console.error('Error removing podcast:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Мои подкасты
        </h1>
        <p className="text-gray-600">
          Отслеживайте рост ваших подкастов и анализируйте конкурентов
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Отслеживаемые подкасты</CardTitle>
            <CardDescription>
              Добавьте подкасты для мониторинга их позиций в чартах
            </CardDescription>
          </CardHeader>
          <CardContent>
            {podcasts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  У вас пока нет отслеживаемых подкастов
                </p>
                <Button onClick={() => router.push('/search')}>
                  + Добавить подкаст
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {podcasts.map((userPodcast) => (
                  <div key={userPodcast.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {userPodcast.podcasts.image_url ? (
                        <Image
                          src={userPodcast.podcasts.image_url}
                          alt={userPodcast.podcasts.title}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Нет фото</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{userPodcast.podcasts.title}</h4>
                      <p className="text-sm text-gray-600 truncate">{userPodcast.podcasts.author}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {userPodcast.podcasts.source === 'spotify' ? 'Spotify' : 'Apple Podcasts'}
                        </Badge>
                        {userPodcast.podcasts.category && (
                          <Badge variant="outline" className="text-xs">
                            {userPodcast.podcasts.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/podcast/${userPodcast.podcast_id}`)}
                      >
                        Подробнее
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePodcast(userPodcast.podcast_id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <Button onClick={() => router.push('/search')} className="w-full">
                    + Добавить еще подкаст
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/search')}
              >
                🔍 Поиск подкастов
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/charts')}
              >
                📊 Просмотр чартов
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/notifications')}
              >
                ⚙️ Настройки уведомлений
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Отслеживаемых подкастов:</span>
                  <span className="font-medium">{podcasts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Текущий план:</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Уведомлений сегодня:</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
