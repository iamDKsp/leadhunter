
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const total = await prisma.company.count();
        const byResponsible = await prisma.company.groupBy({
            by: ['responsibleId'],
            _count: { id: true }
        });

        // Also check status again to be absolutely sure
        const byStatus = await prisma.company.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        console.log('Total:', total);
        console.log('By Status:', byStatus);
        console.log('By Responsible:', byResponsible);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
