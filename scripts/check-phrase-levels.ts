import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

async function checkPhraseLevels() {
  try {
    console.log('Checking phrase levels...')
    
    const levels = await prisma.phraseLevel.findMany({
      orderBy: { score: 'asc' }
    })
    
    console.log('Found phrase levels:', levels)
    
    if (levels.length === 0) {
      console.log('No phrase levels found. Creating default levels...')
      
      // デフォルトのフレーズレベルを作成
      const defaultLevels = [
        { name: 'common', score: 1 },
        { name: 'polite', score: 2 },
        { name: 'casual', score: 3 }
      ]
      
      for (const level of defaultLevels) {
        await prisma.phraseLevel.create({
          data: level
        })
        console.log(`Created level: ${level.name}`)
      }
      
      console.log('Default phrase levels created!')
    } else {
      console.log(`Found ${levels.length} phrase levels`)
    }
    
  } catch (error) {
    console.error('Error checking phrase levels:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPhraseLevels()
