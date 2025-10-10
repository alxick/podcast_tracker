'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Podcast } from '@/lib/types/database'
import Image from 'next/image'
import { useCoverAnalysis } from '@/lib/hooks/useApi'

interface CoverAnalysisProps {
  podcast: Podcast
}

interface AnalysisResult {
  colors: {
    dominant: string
    palette: string[]
  }
  text: {
    hasText: boolean
    textContent?: string
  }
  style: {
    brightness: 'dark' | 'medium' | 'bright'
    contrast: 'low' | 'medium' | 'high'
  }
  recommendations: string[]
}

export function CoverAnalysis({ podcast }: CoverAnalysisProps) {
  const { data: analysis, loading, error, analyzeCover } = useCoverAnalysis()

  const handleAnalyzeCover = async () => {
    if (!podcast.image_url) {
      return
    }

    try {
      await analyzeCover(podcast.image_url, podcast.title)
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  }

  if (!podcast.image_url) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Обложка недоступна для анализа</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-анализ обложки</CardTitle>
          <CardDescription>
            Анализ дизайна и рекомендации по улучшению
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <Image
                src={podcast.image_url}
                alt={podcast.title}
                width={200}
                height={200}
                className="rounded-lg object-cover"
              />
            </div>
            
            <div className="flex-1">
              <p className="text-gray-600 mb-4">
                AI проанализирует цветовую палитру, наличие текста и стиль вашей обложки, 
                а также даст рекомендации по улучшению.
              </p>
              
              <Button 
                onClick={handleAnalyzeCover} 
                disabled={loading}
                className="mb-4"
              >
                {loading ? 'Анализ...' : 'Проанализировать обложку'}
              </Button>
              
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid gap-6">
          {/* Цветовая палитра */}
          <Card>
            <CardHeader>
              <CardTitle>Цветовая палитра</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Доминирующий цвет:</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: analysis.colors.dominant }}
                    ></div>
                    <span className="text-sm text-gray-600">{analysis.colors.dominant}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Цветовая палитра:</p>
                  <div className="flex gap-2">
                    {analysis.colors.palette.map((color: string, index: number) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: color }}
                        title={color}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Анализ текста */}
          <Card>
            <CardHeader>
              <CardTitle>Анализ текста</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={analysis.text.hasText ? 'default' : 'secondary'}>
                    {analysis.text.hasText ? 'Текст найден' : 'Текст не найден'}
                  </Badge>
                </div>
                {analysis.text.textContent && (
                  <p className="text-sm text-gray-600">
                    <strong>Найденный текст:</strong> {analysis.text.textContent}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Стиль */}
          <Card>
            <CardHeader>
              <CardTitle>Стиль обложки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Яркость:</p>
                  <Badge variant="outline">
                    {analysis.style.brightness === 'dark' ? 'Темная' : 
                     analysis.style.brightness === 'medium' ? 'Средняя' : 'Яркая'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Контраст:</p>
                  <Badge variant="outline">
                    {analysis.style.contrast === 'low' ? 'Низкий' : 
                     analysis.style.contrast === 'medium' ? 'Средний' : 'Высокий'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Рекомендации */}
          <Card>
            <CardHeader>
              <CardTitle>Рекомендации</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
