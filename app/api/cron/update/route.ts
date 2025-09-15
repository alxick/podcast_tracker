import { NextRequest, NextResponse } from 'next/server'
import { runCronJob } from '@/lib/cron/update-charts'

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию (в продакшене используйте более надежный способ)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    await runCronJob()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cron job completed successfully' 
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}

// GET endpoint для тестирования
export async function GET() {
  try {
    await runCronJob()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cron job completed successfully' 
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
