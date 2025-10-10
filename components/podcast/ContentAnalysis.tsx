'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Episode } from '@/lib/types/database'
import { useContentAnalysis } from '@/lib/hooks/useApi'
import { 
  FileText, 
  TrendingUp, 
  MessageSquare, 
  BookOpen, 
  Users, 
  Target,
  BarChart3,
  Lightbulb
} from 'lucide-react'

interface ContentAnalysisProps {
  episode: Episode
  podcastId: string
}

interface ContentAnalysisResult {
  topics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  key_phrases: string[]
  structure: {
    has_intro: boolean
    has_outro: boolean
    main_content_duration: number
  }
  engagement_indicators: {
    question_count: number
    story_count: number
    guest_mentions: number
    audience_interaction: number
  }
  content_quality: {
    coherence_score: number
    depth_score: number
    uniqueness_score: number
  }
  recommendations: string[]
  confidence: number
}

export function ContentAnalysis({ episode, podcastId }: ContentAnalysisProps) {
  const { data: analysis, loading, error, analyzeContent } = useContentAnalysis()

  const handleAnalyzeContent = async () => {
    try {
      await analyzeContent(episode.id, podcastId)
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'negative': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'Позитивная'
      case 'negative': return 'Негативная'
      default: return 'Нейтральная'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Анализ контента эпизода
          </CardTitle>
          <CardDescription>
            AI проанализирует содержание эпизода "{episode.title}" и даст рекомендации по улучшению.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Длительность:</strong> {episode.duration ? Math.round(episode.duration / 60) : 'Неизвестно'} минут</p>
              <p><strong>Дата публикации:</strong> {new Date(episode.published_at).toLocaleDateString('ru-RU')}</p>
            </div>
            
            <Button 
              onClick={handleAnalyzeContent} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Анализируем контент...' : 'Проанализировать контент'}
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
          {/* Основные темы */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Основные темы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.topics.map((topic: string, index: number) => (
                  <Badge key={index} variant="default" className="text-sm">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Тональность и ключевые фразы */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Тональность
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getSentimentColor(analysis.sentiment)}>
                  {getSentimentText(analysis.sentiment)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Ключевые фразы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {analysis.key_phrases.map((phrase: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {phrase}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Структура эпизода */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Структура эпизода
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.structure.has_intro ? '✓' : '✗'}
                  </div>
                  <p className="text-sm text-gray-600">Вступление</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.structure.has_outro ? '✓' : '✗'}
                  </div>
                  <p className="text-sm text-gray-600">Заключение</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.structure.main_content_duration}
                  </div>
                  <p className="text-sm text-gray-600">мин основного контента</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Индикаторы вовлеченности */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Вовлеченность аудитории
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.engagement_indicators.question_count}
                  </div>
                  <p className="text-sm text-gray-600">Вопросов</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.engagement_indicators.story_count}
                  </div>
                  <p className="text-sm text-gray-600">Историй</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.engagement_indicators.guest_mentions}
                  </div>
                  <p className="text-sm text-gray-600">Упоминаний гостей</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.engagement_indicators.audience_interaction}
                  </div>
                  <p className="text-sm text-gray-600">Обращений к аудитории</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Качество контента */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Качество контента
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Связность</span>
                    <span>{Math.round(analysis.content_quality.coherence_score * 100)}%</span>
                  </div>
                  <Progress value={analysis.content_quality.coherence_score * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Глубина</span>
                    <span>{Math.round(analysis.content_quality.depth_score * 100)}%</span>
                  </div>
                  <Progress value={analysis.content_quality.depth_score * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Уникальность</span>
                    <span>{Math.round(analysis.content_quality.uniqueness_score * 100)}%</span>
                  </div>
                  <Progress value={analysis.content_quality.uniqueness_score * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Рекомендации */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Рекомендации по улучшению
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.recommendations.map((recommendation: string, index: number) => (
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
