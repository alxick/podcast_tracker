'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Podcast } from '@/lib/types/database'
import { useQualityMonitoring } from '@/lib/hooks/useApi'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingDown,
  RefreshCw,
  Bell
} from 'lucide-react'

interface QualityMonitoringProps {
  podcast: Podcast
}

export function QualityMonitoring({ podcast }: QualityMonitoringProps) {
  const qualityMonitoring = useQualityMonitoring()

  const handleCheckQuality = async () => {
    try {
      await qualityMonitoring.checkQualityAlerts(podcast.id, 'all')
    } catch (error) {
      // Error handled in hook
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'medium': return <TrendingDown className="h-5 w-5 text-yellow-600" />
      default: return <CheckCircle className="h-5 w-5 text-green-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50'
      case 'high': return 'border-orange-200 bg-orange-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      default: return 'border-green-200 bg-green-50'
    }
  }

  const getAlertTypeText = (alertType: string) => {
    switch (alertType) {
      case 'quality_drop': return 'Снижение качества'
      case 'content_consistency': return 'Непоследовательность контента'
      case 'engagement_decline': return 'Снижение вовлеченности'
      case 'trend_miss': return 'Пропуск трендов'
      default: return 'Проблема качества'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Мониторинг качества
        </CardTitle>
        <CardDescription>
          Автоматическое отслеживание качества контента и уведомления о проблемах
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Статус качества</h3>
            <Button 
              onClick={handleCheckQuality}
              disabled={qualityMonitoring.loading}
              size="sm"
              variant="outline"
            >
              {qualityMonitoring.loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Проверить
                </>
              )}
            </Button>
          </div>

          {qualityMonitoring.error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {qualityMonitoring.error}
              </AlertDescription>
            </Alert>
          )}

          {qualityMonitoring.data && qualityMonitoring.data.length === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                Отлично! Проблем с качеством контента не обнаружено.
              </AlertDescription>
            </Alert>
          )}

          {qualityMonitoring.data && qualityMonitoring.data.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-red-600">
                Обнаружено проблем: {qualityMonitoring.data.length}
              </h4>
              
              {qualityMonitoring.data.map((alert: any, index: number) => (
                <Alert key={index} className={getSeverityColor(alert.severity)}>
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getAlertTypeText(alert.alert_type)}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'high' ? 'text-orange-600' :
                            alert.severity === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}
                        >
                          {alert.severity === 'critical' ? 'Критично' :
                           alert.severity === 'high' ? 'Высокий' :
                           alert.severity === 'medium' ? 'Средний' :
                           'Низкий'}
                        </Badge>
                      </div>
                      
                      <AlertDescription className="text-sm mb-3">
                        {alert.message}
                      </AlertDescription>

                      {/* Метрики качества */}
                      {alert.quality_metrics && (
                        <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                          <div>
                            <span className="text-gray-600">Текущий балл: </span>
                            <span className="font-medium">{Math.round(alert.quality_metrics.current_score * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Предыдущий: </span>
                            <span className="font-medium">{Math.round(alert.quality_metrics.previous_score * 100)}%</span>
                          </div>
                        </div>
                      )}

                      {/* Рекомендации */}
                      {alert.recommendations && alert.recommendations.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Рекомендации:</h5>
                          <ul className="space-y-1">
                            {alert.recommendations.map((rec: string, recIndex: number) => (
                              <li key={recIndex} className="text-xs flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Уверенность в анализе */}
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>Уверенность:</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(alert.confidence * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {/* Информация о мониторинге */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">О мониторинге качества</h4>
            <p className="text-xs text-gray-600">
              Система автоматически отслеживает качество вашего контента и уведомляет о проблемах. 
              Проверка включает анализ структуры эпизодов, вовлеченности аудитории и соответствия трендам.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
