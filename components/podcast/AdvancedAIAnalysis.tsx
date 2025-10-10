'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Podcast } from '@/lib/types/database'
import { 
  useEpisodeTrends, 
  useCompetitorComparison, 
  useEpisodeSuccessPrediction 
} from '@/lib/hooks/useApi'
import { 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

interface AdvancedAIAnalysisProps {
  podcast: Podcast
}

export function AdvancedAIAnalysis({ podcast }: AdvancedAIAnalysisProps) {
  const episodeTrends = useEpisodeTrends()
  const competitorComparison = useCompetitorComparison()
  const successPrediction = useEpisodeSuccessPrediction()

  const handleAnalyzeEpisodeTrends = async () => {
    try {
      await episodeTrends.analyzeEpisodeTrends(podcast.id, 30)
    } catch (error) {
      // Error handled in hook
    }
  }

  const handleAnalyzeCompetitorComparison = async () => {
    if (!podcast.category) return
    
    try {
      await competitorComparison.analyzeCompetitorComparison(podcast.id, podcast.category)
    } catch (error) {
      // Error handled in hook
    }
  }

  const getTrendIcon = (growthRate: number) => {
    if (growthRate > 0.1) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (growthRate < -0.1) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Продвинутый AI анализ
        </CardTitle>
        <CardDescription>
          Глубокий анализ трендов, конкурентов и прогнозирование успеха
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Тренды</TabsTrigger>
            <TabsTrigger value="competitors">Конкуренты</TabsTrigger>
            <TabsTrigger value="prediction">Прогноз</TabsTrigger>
          </TabsList>

          {/* Анализ трендов эпизодов */}
          <TabsContent value="trends" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Тренды эпизодов</h3>
              <Button 
                onClick={handleAnalyzeEpisodeTrends}
                disabled={episodeTrends.loading}
                size="sm"
              >
                {episodeTrends.loading ? 'Анализ...' : 'Анализировать'}
              </Button>
            </div>

            {episodeTrends.error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {episodeTrends.error}
              </div>
            )}

            {episodeTrends.data && (
              <div className="space-y-4">
                {/* Популярные темы */}
                <div>
                  <h4 className="font-medium mb-2">Популярные темы</h4>
                  <div className="space-y-2">
                    {episodeTrends.data.trending_topics?.map((topic: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{topic.topic}</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(topic.growth_rate)}
                          <Badge variant="outline">
                            {Math.round(topic.popularity_score * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Рекомендации */}
                <div>
                  <h4 className="font-medium mb-2">Рекомендации</h4>
                  <ul className="space-y-1">
                    {episodeTrends.data.recommendations?.content_strategy?.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Сравнение с конкурентами */}
          <TabsContent value="competitors" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Сравнение с конкурентами</h3>
              <Button 
                onClick={handleAnalyzeCompetitorComparison}
                disabled={competitorComparison.loading}
                size="sm"
              >
                {competitorComparison.loading ? 'Анализ...' : 'Сравнить'}
              </Button>
            </div>

            {competitorComparison.error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {competitorComparison.error}
              </div>
            )}

            {competitorComparison.data && (
              <div className="space-y-4">
                {/* Позиционирование */}
                <div>
                  <h4 className="font-medium mb-2">Позиция на рынке</h4>
                  <Badge className={getSeverityColor(competitorComparison.data.competitive_positioning?.market_position || 'follower')}>
                    {competitorComparison.data.competitive_positioning?.market_position || 'Не определено'}
                  </Badge>
                </div>

                {/* Сильные стороны */}
                <div>
                  <h4 className="font-medium mb-2">Ваши сильные стороны</h4>
                  <div className="flex flex-wrap gap-1">
                    {competitorComparison.data.competitive_positioning?.strengths?.map((strength: string, index: number) => (
                      <Badge key={index} variant="default" className="text-xs">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Рекомендации */}
                <div>
                  <h4 className="font-medium mb-2">Стратегические рекомендации</h4>
                  <ul className="space-y-1">
                    {competitorComparison.data.content_recommendations?.immediate_actions?.map((action: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Target className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Прогнозирование успеха */}
          <TabsContent value="prediction" className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Прогнозирование успеха</h3>
              <p className="text-sm text-gray-600 mb-4">
                Выберите эпизод для прогнозирования его успеха
              </p>
              <Button 
                onClick={() => {
                  // Здесь можно добавить логику выбора эпизода
                  console.log('Episode selection not implemented yet')
                }}
                disabled={successPrediction.loading}
                size="sm"
              >
                {successPrediction.loading ? 'Прогнозирование...' : 'Выбрать эпизод'}
              </Button>
            </div>

            {successPrediction.error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {successPrediction.error}
              </div>
            )}

            {successPrediction.data && (
              <div className="space-y-4">
                {/* Вероятность успеха */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round(successPrediction.data.success_probability * 100)}%
                  </div>
                  <p className="text-sm text-gray-600">Вероятность успеха</p>
                </div>

                {/* Прогнозируемые метрики */}
                <div>
                  <h4 className="font-medium mb-2">Прогнозируемые метрики</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-xl font-bold">{successPrediction.data.predicted_metrics?.estimated_downloads || 0}</div>
                      <div className="text-xs text-gray-600">Скачиваний</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-xl font-bold">{Math.round((successPrediction.data.predicted_metrics?.engagement_score || 0) * 100)}%</div>
                      <div className="text-xs text-gray-600">Вовлеченность</div>
                    </div>
                  </div>
                </div>

                {/* Рекомендации */}
                <div>
                  <h4 className="font-medium mb-2">Рекомендации</h4>
                  <ul className="space-y-1">
                    {successPrediction.data.recommendations?.content_improvements?.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
