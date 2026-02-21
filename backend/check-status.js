
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
    try {
        const total = await prisma.company.count();
        const byStatus = await prisma.company.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });

        console.log('Total companies:', total);
        console.log('By Status:', byStatus);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatus();
