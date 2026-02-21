
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const activeLeads = await prisma.company.findMany({
            where: {
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                status: true,
                stageId: true,
                responsibleId: true,
                folderId: true // just in case
            }
        });

        console.log(`Found ${activeLeads.length} ACTIVE leads.`);

        if (activeLeads.length > 0) {
            console.log('Sample (first 5):', activeLeads.slice(0, 5));
        }

        // Check if there are leads with whitespace in status or something
        const weirdStatus = await prisma.company.findMany({
            where: {
                status: {
                    notIn: ['ACTIVE', 'TRIAGE', 'ARCHIVED', 'Contatado', 'Novo']
                }
            }
        });
        console.log('Weird status leads:', weirdStatus.length);
        if (weirdStatus.length > 0) console.log(weirdStatus[0]);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
