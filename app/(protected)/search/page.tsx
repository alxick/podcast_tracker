'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { SearchForm } from '@/components/search/SearchForm'
import { SearchResults } from '@/components/search/SearchResults'
import { Podcast } from '@/lib/types/database'

export default function SearchPage() {
  const [results, setResults] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(false)
  const [trackingPodcasts, setTrackingPodcasts] = useState<string[]>([])
  const { user } = useAuth()

  // Загружаем отслеживаемые подкасты
  useEffect(() => {
    if (user) {
      loadTrackingPodcasts()
    }
  }, [user])

  const loadTrackingPodcasts = async () => {
    try {
      const response = await fetch('/api/user/podcasts')
      if (response.ok) {
        const data = await response.json()
        setTrackingPodcasts(data.podcasts.map((p: { podcast_id: string }) => p.podcast_id))
      }
    } catch (error) {
      console.error('Error loading tracking podcasts:', error)
    }
  }

  const handleSearch = async (query: string, platform: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/podcasts/search?q=${encodeURIComponent(query)}&platform=${platform}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results)
      } else {
        console.error('Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPodcast = async (podcastId: string) => {
    try {
      const response = await fetch('/api/user/podcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId }),
      })
      
      if (response.ok) {
        setTrackingPodcasts(prev => [...prev, podcastId])
      }
    } catch (error) {
      console.error('Error adding podcast:', error)
    }
  }

  const handleRemovePodcast = async (podcastId: string) => {
    try {
      const response = await fetch(`/api/user/podcasts?podcastId=${podcastId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setTrackingPodcasts(prev => prev.filter(id => id !== podcastId))
      }
    } catch (error) {
      console.error('Error removing podcast:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Поиск подкастов
        </h1>
        <p className="text-gray-600">
          Найдите подкасты для отслеживания в Spotify и Apple Podcasts
        </p>
      </div>

      <div className="space-y-8">
        <SearchForm onSearch={handleSearch} loading={loading} />
        <SearchResults
          results={results}
          loading={loading}
          onAddPodcast={handleAddPodcast}
          onRemovePodcast={handleRemovePodcast}
          trackingPodcasts={trackingPodcasts}
        />
      </div>
    </div>
  )
}
