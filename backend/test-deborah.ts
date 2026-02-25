import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDeborah() {
    const users = await prisma.user.findMany({
        where: {
            name: { contains: 'deborah' }
        },
        include: {
            accessGroup: {
                include: {
                    permissions: true
                }
            }
        }
    });

    console.log('--- DEBORAH USERS ---');
    console.log(JSON.stringify(users, null, 2));

    for (const user of users) {
        const leadCount = await prisma.company.count({
            where: { responsibleId: user.id }
        });
        console.log(`Leads for ${user.name} (${user.id}): ${leadCount}`);

        const leads = await prisma.company.findMany({
            where: { responsibleId: user.id },
            take: 2,
            select: {
                id: true,
                name: true,
                status: true,
                stageId: true,
                responsibleId: true,
            }
        });
        console.log(`Sample leads:`, leads);
    }
}

checkDeborah().catch(console.error).finally(() => prisma.$disconnect());
