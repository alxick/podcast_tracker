import { NextRequest, NextResponse } from 'next/server'
import { getPodcastChartHistory } from '@/lib/services/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const history = await getPodcastChartHistory(id, days)

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Get chart history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
