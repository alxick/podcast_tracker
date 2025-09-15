import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!settings) {
      // Создаем настройки по умолчанию
      const { data: newSettings } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
          email_notifications: true,
          telegram_notifications: false,
          daily_digest: true,
          instant_alerts: false
        })
        .select()
        .single()

      return NextResponse.json({ settings: newSettings })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error getting notification settings:', error)
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

    const { email_notifications, telegram_notifications, daily_digest, instant_alerts } = await request.json()

    const { data: settings } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        email_notifications: email_notifications ?? true,
        telegram_notifications: telegram_notifications ?? false,
        daily_digest: daily_digest ?? true,
        instant_alerts: instant_alerts ?? false
      })
      .select()
      .single()

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
