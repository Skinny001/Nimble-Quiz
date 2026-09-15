import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const host = await prisma.user.upsert({
    where: { nimiqAddress: 'NQ7A_HOST_ADDRESS_HERE' },
    update: {},
    create: {
      nimiqAddress: 'NQ7A_HOST_ADDRESS_HERE',
      displayName: 'QuizMaster',
    },
  })

  const round = await prisma.triviaRound.create({
    data: {
      hostId: host.id,
      title: 'General Knowledge Quiz',
      category: 'General Knowledge',
      categoryMode: 'SINGLE',
      stakeAmount: 5,
      questionCount: 10,
      timePerQuestionSeconds: 20,
      payoutRule: 'TOP3_SPLIT',
      maxPlayers: 10,
      status: 'OPEN',
    },
  })

  console.log('Created host:', host.nimiqAddress)
  console.log('Created round:', round.id, round.title)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })