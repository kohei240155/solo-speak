import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Mock Speak ranking API called')
    
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'
    const period = searchParams.get('period') || 'weekly'
    
    console.log('Mock Parameters:', { language, period })

    // モックデータを返す
    const mockData = {
      success: true,
      topUsers: [
        {
          rank: 1,
          userId: "user-1",
          username: "Solo Ichiro",
          iconUrl: null,
          count: 50
        },
        {
          rank: 2,
          userId: "user-2",
          username: "Solo Taro",
          iconUrl: null,
          count: 48
        },
        {
          rank: 3,
          userId: "user-3",
          username: "Solo Hanako",
          iconUrl: null,
          count: 45
        },
        {
          rank: 4,
          userId: "user-4",
          username: "Solo Jiro",
          iconUrl: null,
          count: 42
        },
        {
          rank: 5,
          userId: "user-5",
          username: "Solo Saburo",
          iconUrl: null,
          count: 40
        }
      ],
      currentUser: {
        rank: 25,
        userId: "user-999",
        username: "You",
        iconUrl: null,
        count: 10
      }
    }

    console.log('Returning mock data:', mockData)
    
    return NextResponse.json(mockData)

  } catch (error) {
    console.error('Mock API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
