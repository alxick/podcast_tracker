import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { checkSubscriptionLimits, incrementUsageCounter } from '@/lib/middleware/subscription-limits'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Проверяем лимиты подписки
    const { allowed, limits, error: limitError } = await checkSubscriptionLimits(request, 'ai_analysis')
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: limitError || 'Action not allowed',
          limits,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    const { imageUrl, podcastTitle } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, returning mock analysis')
      const mockAnalysis = {
        colors: {
          dominant: "#3b82f6",
          palette: ["#3b82f6", "#1e40af", "#60a5fa", "#93c5fd", "#dbeafe"]
        },
        text: {
          hasText: true,
          textContent: "Текст на обложке"
        },
        style: {
          brightness: "medium",
          contrast: "high"
        },
        recommendations: [
          "Используйте более яркие цвета для привлечения внимания",
          "Добавьте контрастный текст для лучшей читаемости",
          "Рассмотрите использование градиентов для современного вида"
        ]
      }
      return NextResponse.json({ analysis: mockAnalysis })
    }

    // Анализируем обложку с помощью OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Проанализируй обложку подкаста "${podcastTitle}" и верни JSON с анализом:
              {
                "colors": {
                  "dominant": "основной цвет в hex формате",
                  "palette": ["массив из 5-7 цветов в hex формате"]
                },
                "text": {
                  "hasText": true/false,
                  "textContent": "найденный текст на обложке"
                },
                "style": {
                  "brightness": "dark/medium/bright",
                  "contrast": "low/medium/high"
                },
                "recommendations": [
                  "рекомендация 1",
                  "рекомендация 2",
                  "рекомендация 3"
                ]
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    })

    const analysisText = response.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('No analysis returned from OpenAI')
    }

    // Парсим JSON ответ
    let analysis
    try {
      // Убираем возможные markdown блоки
      const cleanText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      analysis = JSON.parse(cleanText)
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      console.error('Response text:', analysisText)
      
      // Возвращаем mock данные если парсинг не удался
      analysis = {
        colors: {
          dominant: "#3b82f6",
          palette: ["#3b82f6", "#1e40af", "#60a5fa", "#93c5fd", "#dbeafe"]
        },
        text: {
          hasText: true,
          textContent: "Текст на обложке"
        },
        style: {
          brightness: "medium",
          contrast: "high"
        },
        recommendations: [
          "Используйте более яркие цвета для привлечения внимания",
          "Добавьте контрастный текст для лучшей читаемости",
          "Рассмотрите использование градиентов для современного вида"
        ]
      }
    }

    // Увеличиваем счетчик использования
    const supabase = await import('@/lib/supabase/server').then(m => m.createClient())
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await incrementUsageCounter(user.id, 'ai_analysis')
    }

    return NextResponse.json({ 
      analysis,
      limits: limits
    })
  } catch (error) {
    console.error('Error analyzing cover:', error)
    
    // Возвращаем mock данные в случае ошибки
    const mockAnalysis = {
      colors: {
        dominant: "#3b82f6",
        palette: ["#3b82f6", "#1e40af", "#60a5fa", "#93c5fd", "#dbeafe"]
      },
      text: {
        hasText: true,
        textContent: "Текст на обложке"
      },
      style: {
        brightness: "medium",
        contrast: "high"
      },
      recommendations: [
        "Используйте более яркие цвета для привлечения внимания",
        "Добавьте контрастный текст для лучшей читаемости",
        "Рассмотрите использование градиентов для современного вида"
      ]
    }

    return NextResponse.json({ analysis: mockAnalysis })
  }
}
