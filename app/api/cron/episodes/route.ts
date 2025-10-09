import { NextRequest, NextResponse } from 'next/server'
import { runEpisodesUpdate } from '@/lib/cron/update-charts'

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    await runEpisodesUpdate()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Episodes update completed successfully' 
    })
  } catch (error) {
    console.error('Episodes update error:', error)
    return NextResponse.json(
      { error: 'Episodes update failed' },
      { status: 500 }
    )
  }
}

// GET endpoint для тестирования
export async function GET() {
  try {
    await runEpisodesUpdate()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Episodes update completed successfully' 
    })
  } catch (error) {
    console.error('Episodes update error:', error)
    return NextResponse.json(
      { error: 'Episodes update failed' },
      { status: 500 }
    )
  }
}
