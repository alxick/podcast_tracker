import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getNotificationSettings, 
  updateNotificationSettings,
  createDefaultNotificationSettings 
} from '@/lib/services/notifications'

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

    const settings = await getNotificationSettings(user.id)

    if (!settings) {
      return NextResponse.json(
        { error: 'Failed to get notification settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get notification settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email_frequency, notification_types } = body

    // Валидация
    if (email_frequency && !['instant', 'daily', 'weekly'].includes(email_frequency)) {
      return NextResponse.json(
        { error: 'Invalid email frequency' },
        { status: 400 }
      )
    }

    if (notification_types) {
      const validTypes = ['position_changes', 'new_episodes', 'competitor_actions', 'trends']
      const invalidTypes = Object.keys(notification_types).filter(
        key => !validTypes.includes(key) || typeof notification_types[key] !== 'boolean'
      )
      
      if (invalidTypes.length > 0) {
        return NextResponse.json(
          { error: 'Invalid notification types' },
          { status: 400 }
        )
      }
    }

    const updatedSettings = await updateNotificationSettings(user.id, {
      email_frequency,
      notification_types
    })

    return NextResponse.json({ settings: updatedSettings })
  } catch (error) {
    console.error('Update notification settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}