'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CountrySelector } from '@/components/ui/country-selector'
import Image from 'next/image'

interface ChartPodcast {
  id: string
  source: 'spotify' | 'apple'
  source_id: string
  title: string
  author: string
  description?: string
  image_url?: string
  category: string
  position: number
  rss_url?: string
}

const categories = [
  { id: '1310', name: 'Technology' },
  { id: '1302', name: 'Business' },
  { id: '1303', name: 'Comedy' },
  { id: '1304', name: 'Education' },
  { id: '1305', name: 'Games & Hobbies' },
  { id: '1306', name: 'Government & Organizations' },
  { id: '1307', name: 'Health' },
  { id: '1308', name: 'Kids & Family' },
  { id: '1309', name: 'Music' },
  { id: '1311', name: 'News & Politics' },
  { id: '1312', name: 'Religion & Spirituality' },
  { id: '1313', name: 'Science & Medicine' },
  { id: '1314', name: 'Society & Culture' },
  { id: '1315', name: 'Sports & Recreation' },
  { id: '1316', name: 'TV & Film' },
]

export default function ChartsPage() {
  const [charts, setCharts] = useState<ChartPodcast[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<'spotify' | 'apple'>('apple')
  const [selectedCategory, setSelectedCategory] = useState('1310')
  const [selectedCountry, setSelectedCountry] = useState('ru')

  useEffect(() => {
    loadCharts()
  }, [selectedPlatform, selectedCategory, selectedCountry])

  const loadCharts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/charts?platform=${selectedPlatform}&category=${selectedCategory}&limit=50&country=${selectedCountry}`)
      if (response.ok) {
        const data = await response.json()
        setCharts(data.charts)
      }
    } catch (error) {
      console.error('Error loading charts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Топ-чарты
        </h1>
        <p className="text-gray-600">
          Просматривайте популярные подкасты по категориям
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Фильтры</CardTitle>
            <CardDescription>
              Выберите платформу и категорию для просмотра чартов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Платформа:</p>
                <div className="flex gap-2">
                  <Button
                    variant={selectedPlatform === 'apple' ? 'default' : 'outline'}
                    onClick={() => setSelectedPlatform('apple')}
                    disabled={loading}
                  >
                    Apple Podcasts
                  </Button>
                  <Button
                    variant={selectedPlatform === 'spotify' ? 'default' : 'outline'}
                    onClick={() => setSelectedPlatform('spotify')}
                    disabled={loading}
                  >
                    Spotify
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Категория:</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      disabled={loading}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Страна:</p>
                <CountrySelector
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                  platform={selectedPlatform}
                  className="w-64"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Топ-50 подкастов</CardTitle>
            <CardDescription>
              Самые популярные подкасты в категории {categories.find(c => c.id === selectedCategory)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Загрузка чартов...</p>
              </div>
            ) : charts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Чарты не найдены</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Подкаст</TableHead>
                      <TableHead>Автор</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Платформа</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charts.map((podcast) => (
                      <TableRow key={podcast.id}>
                        <TableCell className="font-semibold">
                          {podcast.position}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {podcast.image_url ? (
                              <Image
                                src={podcast.image_url}
                                alt={podcast.title}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Нет фото</span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium truncate max-w-xs">{podcast.title}</p>
                              {podcast.description && (
                                <p className="text-sm text-gray-600 truncate max-w-xs">
                                  {podcast.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600">{podcast.author}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {podcast.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {podcast.source === 'spotify' ? 'Spotify' : 'Apple Podcasts'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
