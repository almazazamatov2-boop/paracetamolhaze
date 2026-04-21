import { PrismaClient } from '../../prisma/generated/kinoquiz-client'

const globalForPrisma = globalThis as unknown as {
  prismaKinoQuiz: PrismaClient | undefined
}

export const kinoquizDb =
  globalForPrisma.prismaKinoQuiz ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaKinoQuiz = kinoquizDb
