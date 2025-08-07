import { NextResponse } from 'next/server'

/**
 * @deprecated このエンドポイントは廃止予定です。/api/phrase/remaining を使用してください。
 */
export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use /api/phrase/remaining instead.',
      deprecatedEndpoint: '/api/user/phrase-generations',
      newEndpoint: '/api/phrase/remaining'
    },
    { status: 410 } // Gone
  )
}
