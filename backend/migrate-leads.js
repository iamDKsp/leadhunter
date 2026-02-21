
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    try {
        console.log('Starting migration...');

        // Check current counts
        const before = await prisma.company.groupBy({
            by: ['status'],
            _count: { id: true }
        });
        console.log('Before:', before);

        // Update all leads that act like they are active but have legacy status
        // OR just update everything that isn't TRIAGE/ACTIVE/ARCHIVED
        const result = await prisma.company.updateMany({
            where: {
                status: {
                    notIn: ['ACTIVE', 'TRIAGE', 'ARCHIVED']
                }
            },
            data: {
                status: 'ACTIVE'
            }
        });

        console.log(`Updated ${result.count} leads to ACTIVE status.`);

        // Check after counts
        const after = await prisma.company.groupBy({
            by: ['status'],
            _count: { id: true }
        });
        console.log('After:', after);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
