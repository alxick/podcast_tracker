'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SearchFormProps {
  onSearch: (query: string, platform: string) => void
  loading: boolean
}

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState('all')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim(), platform)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Поиск подкастов</CardTitle>
        <CardDescription>
          Найдите подкасты в Spotify и Apple Podcasts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введите название подкаста..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? 'Поиск...' : 'Найти'}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant={platform === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlatform('all')}
              disabled={loading}
            >
              Все платформы
            </Button>
            <Button
              type="button"
              variant={platform === 'spotify' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlatform('spotify')}
              disabled={loading}
            >
              Spotify
            </Button>
            <Button
              type="button"
              variant={platform === 'apple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlatform('apple')}
              disabled={loading}
            >
              Apple Podcasts
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
