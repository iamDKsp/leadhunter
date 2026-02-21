
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const byStage = await prisma.company.groupBy({
            by: ['stageId'],
            _count: { id: true }
        });

        console.log('By Stage:', byStage);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
