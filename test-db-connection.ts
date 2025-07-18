import { prisma } from '@/utils/prisma'

// 言語データの直接取得をテスト
async function testLanguageDataAccess() {
  console.log('🧪 Testing language data access...')
  
  try {
    const languages = await prisma.language.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log('✅ Language data retrieved successfully:')
    console.log(`Found ${languages.length} languages`)
    console.log('First few languages:', languages.slice(0, 3))
    
    return languages
  } catch (error) {
    console.error('❌ Error accessing language data:', error)
    throw error
  }
}

// データベース接続テスト
async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...')
  
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // 簡単なクエリテスト
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database query test successful:', result)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// メイン実行関数
async function main() {
  console.log('🚀 Starting database diagnostic tests...')
  
  try {
    await testDatabaseConnection()
    await testLanguageDataAccess()
    console.log('🎉 All tests passed!')
  } catch (error) {
    console.error('💥 Tests failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
