import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHistory() {
    const deborah = await prisma.user.findFirst({
        where: { name: { contains: 'deborah' } }
    });

    if (!deborah) {
        console.log('Deborah not found');
        return;
    }

    const history = await prisma.leadAssignmentHistory.findMany({
        where: { newUserId: deborah.id },
        orderBy: { createdAt: 'desc' },
        select: {
            companyId: true,
            createdAt: true,
            assignedById: true,
        }
    });

    console.log(`History count for ${deborah.name}: ${history.length}`);

    if (history.length > 0) {
        // Check the current responsible ID for the first 5 leads in history
        const companyIds = history.map(h => h.companyId).slice(0, 5);
        const leads = await prisma.company.findMany({
            where: { id: { in: companyIds } },
            select: { id: true, responsibleId: true, status: true, stageId: true, name: true }
        });
        console.log('Sample leads from history current state:');
        console.log(JSON.stringify(leads, null, 2));

        // Check how many of these history records actually have her as responsible right now
        const allCompanyIds = history.map(h => h.companyId);
        const assignedToHer = await prisma.company.count({
            where: { id: { in: allCompanyIds }, responsibleId: deborah.id }
        });

        console.log(`Out of ${history.length} leads transferred to her historically, ${assignedToHer} are currently assigned to her.`);
    }
}

checkHistory().catch(console.error).finally(() => prisma.$disconnect());
