import { PrismaClient } from '@/generated/prisma/client'

// Global Prisma client for development
declare global {
  var prisma: PrismaClient | undefined
}

/**
 * Prismaクライアントのシングルトンインスタンス
 * 開発環境ではグローバルインスタンスを使用してホットリロード時の接続問題を回避
 * 本番環境では新しいインスタンスを作成
 */
export const prisma = (() => {
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient({
      log: ['error']
    })
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['error', 'warn']
      })
    }
    return global.prisma
  }
})()

/**
 * Prisma接続のクリーンアップ
 * アプリケーション終了時に呼び出す
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect()
}
