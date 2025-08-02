import { PrismaClient } from './src/generated/prisma'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        nativeLanguage: true,
        defaultLearningLanguage: true
      }
    })
    
    console.log('Current users count:', users.length)
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user.id,
        username: user.username,
        email: user.email,
        nativeLanguage: user.nativeLanguage?.name,
        defaultLearningLanguage: user.defaultLearningLanguage?.name,
        hasRequiredSettings: !!(user.username && user.nativeLanguage && user.defaultLearningLanguage)
      })
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
