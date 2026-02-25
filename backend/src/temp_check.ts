import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const stages = await prisma.stage.findMany();
    console.log('Stages:', stages);
}

main().finally(() => prisma.$disconnect());
