import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPodcasts, addUserPodcast, removeUserPodcast, createUser, userExists } from '@/lib/services/database'
import { checkSubscriptionLimits, incrementUsageCounter } from '@/lib/middleware/subscription-limits'

// Вспомогательная функция для проверки и создания пользователя
async function ensureUserExists(userId: string, email: string) {
  const exists = await userExists(userId)
  if (!exists) {
    await createUser(userId, email)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Проверяем, существует ли пользователь в БД, если нет - создаем
    await ensureUserExists(user.id, user.email || '')

    const podcasts = await getUserPodcasts(user.id)

    return NextResponse.json({ podcasts })
  } catch (error) {
    console.error('Get user podcasts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Проверяем, существует ли пользователь в БД, если нет - создаем
    await ensureUserExists(user.id, user.email || '')

    // Проверяем лимиты подписки
    const { allowed, limits, error: limitError } = await checkSubscriptionLimits(request, 'track_podcast')
    
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

    const { podcastId } = await request.json()

    if (!podcastId) {
      return NextResponse.json(
        { error: 'Podcast ID is required' },
        { status: 400 }
      )
    }

    const result = await addUserPodcast(user.id, podcastId)

    // Увеличиваем счетчик использования
    await incrementUsageCounter(user.id, 'track_podcast')

    return NextResponse.json({ 
      success: true, 
      data: result,
      limits: limits
    })
  } catch (error) {
    console.error('Add user podcast error:', error)
    
    // Более детальная обработка ошибок
    if (error instanceof Error) {
      if (error.message === 'Podcast not found') {
        return NextResponse.json(
          { error: 'Подкаст не найден в базе данных. Попробуйте найти его снова.' },
          { status: 404 }
        )
      }
      if (error.message === 'Podcast already being tracked') {
        return NextResponse.json(
          { error: 'Подкаст уже отслеживается' },
          { status: 409 }
        )
      }
      if (error.message === 'Failed to add user podcast') {
        return NextResponse.json(
          { error: 'Ошибка базы данных при добавлении подкаста' },
          { status: 500 }
        )
      }
      if (error.message === 'Invalid user or podcast ID') {
        return NextResponse.json(
          { error: 'Неверный ID пользователя или подкаста' },
          { status: 400 }
        )
      }
      if (error.message === 'Invalid data format') {
        return NextResponse.json(
          { error: 'Неверный формат данных' },
          { status: 400 }
        )
      }
      if (error.message.startsWith('Database error:')) {
        return NextResponse.json(
          { error: `Ошибка базы данных: ${error.message.replace('Database error: ', '')}` },
          { status: 500 }
        )
      }
    }
    
    // Логируем полную ошибку для отладки
    console.error('Unexpected error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    
    return NextResponse.json(
      { 
        error: `Ошибка сервера: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const podcastId = searchParams.get('podcastId')

    if (!podcastId) {
      return NextResponse.json(
        { error: 'Podcast ID is required' },
        { status: 400 }
      )
    }

    await removeUserPodcast(user.id, podcastId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove user podcast error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
