import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPodcasts, addUserPodcast, removeUserPodcast, createUser, userExists } from '@/lib/services/database'

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
    const exists = await userExists(user.id)
    if (!exists) {
      await createUser(user.id, user.email || '')
    }

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
    const exists = await userExists(user.id)
    if (!exists) {
      await createUser(user.id, user.email || '')
    }

    const { podcastId } = await request.json()

    if (!podcastId) {
      return NextResponse.json(
        { error: 'Podcast ID is required' },
        { status: 400 }
      )
    }

    const result = await addUserPodcast(user.id, podcastId)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Add user podcast error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
