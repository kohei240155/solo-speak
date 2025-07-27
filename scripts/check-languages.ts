import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function checkLanguages() {
  try {
    console.log('Checking languages in database...')
    
    const languages = await prisma.language.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log('Found languages:', languages.length)
    languages.forEach(lang => {
      console.log(`- ID: ${lang.id}, Name: ${lang.name}, Code: ${lang.code}`)
    })
    
    if (languages.length === 0) {
      console.log('No languages found, seeding basic languages...')
      
      const basicLanguages = [
        { name: 'Japanese', code: 'ja' },
        { name: 'English', code: 'en' },
        { name: 'Chinese', code: 'zh' },
        { name: 'Korean', code: 'ko' },
        { name: 'Spanish', code: 'es' },
        { name: 'Portuguese', code: 'pt' },
        { name: 'Thai', code: 'th' }
      ]
      
      for (const language of basicLanguages) {
        const created = await prisma.language.upsert({
          where: { code: language.code },
          update: {},
          create: {
            name: language.name,
            code: language.code
          }
        })
        console.log(`Created/Updated: ${created.name} (${created.id})`)
      }
    }
    
  } catch (error) {
    console.error('Error checking languages:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLanguages()
