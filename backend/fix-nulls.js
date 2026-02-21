
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    try {
        console.log('Fixing nulls...');

        // Fix Status
        const statusResult = await prisma.company.updateMany({
            where: {
                status: null
            },
            data: {
                status: 'ACTIVE'
            }
        });
        console.log(`Updated ${statusResult.count} leads with NULL status to ACTIVE.`);

        // Fix Stages
        const stageResult = await prisma.company.updateMany({
            where: {
                stageId: null
            },
            data: {
                stageId: 'prospeccao'
            }
        });
        console.log(`Updated ${stageResult.count} leads with NULL stageId to prospeccao.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
