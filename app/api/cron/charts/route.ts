import { NextRequest, NextResponse } from 'next/server'
import { runChartsUpdate } from '@/lib/cron/update-charts'

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
    
    await runChartsUpdate()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Charts update completed successfully' 
    })
  } catch (error) {
    console.error('Charts update error:', error)
    return NextResponse.json(
      { error: 'Charts update failed' },
      { status: 500 }
    )
  }
}

// GET endpoint для тестирования
export async function GET() {
  try {
    await runChartsUpdate()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Charts update completed successfully' 
    })
  } catch (error) {
    console.error('Charts update error:', error)
    return NextResponse.json(
      { error: 'Charts update failed' },
      { status: 500 }
    )
  }
}
