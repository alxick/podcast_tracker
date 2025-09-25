'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  Users, 
  Target,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { AIAnalysisResult } from '@/lib/services/ai-analysis'

interface AIAnalysisProps {
  podcastId: string
  podcastTitle: string
}

export function AIAnalysis({ podcastId, podcastTitle }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze-position-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ podcastId }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
      } else {
        const errorData = await response.json()
        if (errorData.upgradeRequired) {
          setError('Upgrade your plan to access AI analysis')
        } else {
          setError(errorData.error || 'Failed to analyze position changes')
        }
      }
    } catch (err) {
      setError('Failed to analyze position changes')
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Высокая'
    if (confidence >= 0.6) return 'Средняя'
    return 'Низкая'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <CardTitle>AI Анализ причин изменений</CardTitle>
          </div>
          <Button 
            onClick={runAnalysis}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Анализируем...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Запустить анализ
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          AI проанализирует причины роста или падения позиций вашего подкаста
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Резюме анализа
              </h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {analysis.summary}
              </p>
              <div className="mt-2">
                <Badge className={getConfidenceColor(analysis.confidence)}>
                  Уверенность: {getConfidenceText(analysis.confidence)} ({Math.round(analysis.confidence * 100)}%)
                </Badge>
              </div>
            </div>

            {/* Reasons */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Positive reasons */}
              {analysis.reasons.positive.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Причины роста
                  </h4>
                  <ul className="space-y-1">
                    {analysis.reasons.positive.map((reason: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Negative reasons */}
              {analysis.reasons.negative.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Причины падения
                  </h4>
                  <ul className="space-y-1">
                    {analysis.reasons.negative.map((reason: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Рекомендации
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg flex items-start gap-2">
                      <span className="text-blue-500 mt-1">💡</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Competitor insights */}
            {analysis.competitor_insights.length > 0 && (
              <div>
                <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Инсайты о конкурентах
                </h4>
                <ul className="space-y-1">
                  {analysis.competitor_insights.map((insight: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-purple-500 mt-1">🔍</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!analysis && !loading && !error && (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Нажмите "Запустить анализ" чтобы получить AI-инсайты</p>
            <p className="text-sm">Анализ займет несколько секунд</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
