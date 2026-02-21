
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const stages = await prisma.stage.findMany();
        console.log('Stages:', stages);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
