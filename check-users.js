const { PrismaClient } = require('./src/generated/prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking database connection...');
    
    // ユーザー数を確認
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);
    
    // 言語数を確認
    const languageCount = await prisma.language.count();
    console.log(`Total languages in database: ${languageCount}`);
    
    // フレーズレベル数を確認
    const phraseLevelCount = await prisma.phraseLevel.count();
    console.log(`Total phrase levels in database: ${phraseLevelCount}`);
    
    // 全ユーザーをリスト表示
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true
        }
      });
      console.log('\nUsers in database:');
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
      });
    }
    
    // 全言語をリスト表示
    if (languageCount > 0) {
      const languages = await prisma.language.findMany({
        select: {
          id: true,
          name: true,
          code: true
        }
      });
      console.log('\nLanguages in database:');
      languages.forEach(lang => {
        console.log(`- ${lang.name} (${lang.code}): ${lang.id}`);
      });
    }
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
