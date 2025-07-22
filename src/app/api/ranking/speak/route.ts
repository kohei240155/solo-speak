import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('Speak ranking API called')
    
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'
    const period = searchParams.get('period') || 'daily'
    
    console.log('Parameters:', { language, period })

    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // 期間に応じた日付条件を設定
    const now = new Date()
    let startDate: string
    
    if (period === 'daily') {
      startDate = new Date(now.toDateString()).toISOString()
    } else if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      startDate = weekAgo.toISOString()
    } else {
      // total の場合は全期間
      startDate = '1970-01-01T00:00:00.000Z'
    }

    // Speak Logsテーブルからランキングデータを取得（phrasesテーブル経由でユーザー情報を取得）
    const { data: speakLogs, error } = await supabase
      .from('speak_logs')
      .select(`
        count,
        date,
        phrases!inner(
          user_id,
          language_id,
          users!inner(
            id,
            username,
            icon_url
          )
        )
      `)
      .eq('phrases.language_id', language)
      .gte('date', startDate)

    console.log('Supabase query executed:', { speakLogs, error })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
    }

    // ユーザーごとのSpeak回数を集計
    const userCounts = new Map<string, { userId: string, username: string, iconUrl: string | null, count: number }>()

    speakLogs?.forEach((log: any) => {
      // Supabaseのinner joinで返されるデータ構造に対応
      const phrase = log.phrases
      if (!phrase || !phrase.users) return
      
      const userId = phrase.users.id
      const username = phrase.users.username
      const iconUrl = phrase.users.icon_url
      const speakCount = log.count || 1

      if (userCounts.has(userId)) {
        userCounts.get(userId)!.count += speakCount
      } else {
        userCounts.set(userId, {
          userId,
          username,
          iconUrl,
          count: speakCount
        })
      }
    })

    // ランキング順にソート
    const rankedUsers = Array.from(userCounts.values())
      .sort((a, b) => b.count - a.count)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        iconUrl: user.iconUrl,
        count: user.count
      }))

    // 現在のユーザーの順位を取得
    const currentUserRank = rankedUsers.find(u => u.userId === user.id)

    return NextResponse.json({
      success: true,
      topUsers: rankedUsers,
      currentUser: currentUserRank || null
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
