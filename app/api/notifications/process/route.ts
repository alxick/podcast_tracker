import { NextRequest, NextResponse } from 'next/server'
import { processScheduledNotifications } from '@/lib/services/notifications'

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию для cron job
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await processScheduledNotifications()

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications processed successfully' 
    })
  } catch (error) {
    console.error('Error processing notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
