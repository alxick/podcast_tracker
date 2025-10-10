'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Podcast } from '@/lib/types/database'
import { useTrendAnalysis } from '@/lib/hooks/useApi'
import { TrendingUp, Calendar, Users, Target, Lightbulb } from 'lucide-react'

interface TrendAnalysisProps {
  podcast: Podcast
}

interface TrendAnalysisResult {
  trending_topics: string[]
  seasonal_patterns: string[]
  competitor_moves: string[]
  opportunity_alerts: string[]
  recommendations: string[]
  confidence: number
}

export function TrendAnalysis({ podcast }: TrendAnalysisProps) {
  const { data: analysis, loading, error, analyzeTrends } = useTrendAnalysis()

  const handleAnalyzeTrends = async () => {
    if (!podcast.category) {
      return
    }

    try {
      await analyzeTrends(podcast.id, podcast.category)
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  }

  if (!podcast.category) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Категория подкаста не определена для анализа трендов</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Анализ трендов в категории "{podcast.category}"
          </CardTitle>
          <CardDescription>
            AI проанализирует популярные темы, сезонные паттерны и возможности для роста в вашей нише.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleAnalyzeTrends} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Анализируем тренды...' : 'Проанализировать тренды'}
            </Button>
            
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6">
          {/* Популярные темы */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Популярные темы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.trending_topics.map((topic, index) => (
                  <Badge key={index} variant="default" className="text-sm">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Сезонные паттерны */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Сезонные паттерны
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.seasonal_patterns.map((pattern, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{pattern}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Движения конкурентов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Что делают конкуренты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.competitor_moves.map((move, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{move}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Возможности */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Возможности для роста
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.opportunity_alerts.map((opportunity, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Рекомендации */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Рекомендации
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Уверенность в анализе:</span>
                  <Badge variant="outline">
                    {Math.round(analysis.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
