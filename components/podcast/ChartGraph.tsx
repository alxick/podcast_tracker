'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ChartGraphProps {
  podcastId: string
}

interface ChartData {
  date: string
  position: number
  platform: string
  category: string
}

export function ChartGraph({ podcastId }: ChartGraphProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [trend, setTrend] = useState<{ direction: 'up' | 'down' | 'stable', change: number } | null>(null)

  useEffect(() => {
    loadChartData()
  }, [podcastId, days])

  const loadChartData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/charts/${podcastId}/history?days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setChartData(data.history)
        calculateTrend(data.history)
      }
    } catch (error) {
      console.error('Error loading chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTrend = (data: ChartData[]) => {
    if (data.length < 2) {
      setTrend(null)
      return
    }

    const firstPosition = data[0].position
    const lastPosition = data[data.length - 1].position
    const change = firstPosition - lastPosition

    if (Math.abs(change) < 2) {
      setTrend({ direction: 'stable', change: 0 })
    } else if (change > 0) {
      setTrend({ direction: 'up', change })
    } else {
      setTrend({ direction: 'down', change: Math.abs(change) })
    }
  }

  const exportData = () => {
    const csvContent = [
      ['Date', 'Position', 'Platform', 'Category'],
      ...chartData.map((item: { date: string; position: number; platform: string; category: string }) => [
        item.date,
        item.position.toString(),
        item.platform,
        item.category
      ])
    ].map((row: string[]) => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `podcast-chart-data-${podcastId}-${days}days.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getFilteredData = () => {
    if (selectedPlatform === 'all') {
      return chartData
    }
    return chartData.filter(item => item.platform === selectedPlatform)
  }

  const getUniquePlatforms = () => {
    return Array.from(new Set(chartData.map((item: { platform: string }) => item.platform)))
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM', { locale: ru })
    } catch {
      return dateString
    }
  }

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{formatDate(label || '')}</p>
          <p className="text-blue-600">
            Позиция: {payload[0].value}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка данных чартов...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Позиции в чартах</CardTitle>
          <CardDescription>
            История позиций подкаста в чартах
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <p>Данные о позициях в чартах отсутствуют</p>
            <p className="text-sm">Подкаст может не попадать в топ-чарты</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Позиции в чартах
              {trend && (
                <Badge 
                  variant={trend.direction === 'up' ? 'default' : trend.direction === 'down' ? 'destructive' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
                  {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
                  {trend.direction === 'stable' && <Minus className="h-3 w-3" />}
                  {trend.direction === 'up' && `+${trend.change}`}
                  {trend.direction === 'down' && `-${trend.change}`}
                  {trend.direction === 'stable' && 'Стабильно'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              История позиций подкаста за последние {days} дней
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              disabled={chartData.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Экспорт
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <div className="flex gap-2">
            <Button
              variant={days === 7 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(7)}
            >
              7 дней
            </Button>
            <Button
              variant={days === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(30)}
            >
              30 дней
            </Button>
            <Button
              variant={days === 90 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(90)}
            >
              90 дней
            </Button>
          </div>
          
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Платформа" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все платформы</SelectItem>
              {getUniquePlatforms().map((platform: string) => (
                <SelectItem key={platform} value={platform}>
                  {platform === 'spotify' ? 'Spotify' : 'Apple Podcasts'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getFilteredData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                reversed
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="position" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>• Чем ниже позиция, тем выше рейтинг подкаста</p>
          <p>• Данные обновляются ежедневно</p>
        </div>
      </CardContent>
    </Card>
  )
}
