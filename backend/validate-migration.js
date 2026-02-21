
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const all = await prisma.company.findMany({
            select: {
                id: true,
                status: true,
                stageId: true
            }
        });

        console.log(`Total leads: ${all.length}`);

        const counts = {};
        all.forEach(l => {
            counts[l.status] = (counts[l.status] || 0) + 1;
        });
        console.log('Status counts:', counts);

        const stageCounts = {};
        all.forEach(l => {
            stageCounts[l.stageId] = (stageCounts[l.stageId] || 0) + 1;
        });
        console.log('Stage counts:', stageCounts);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
