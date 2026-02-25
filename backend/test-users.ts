import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            _count: {
                select: { assignedLeads: true }
            }
        }
    });

    console.log('All Users:');
    console.table(users.map(u => ({ ...u, leads: u._count.assignedLeads })));
}

checkUsers().catch(console.error).finally(() => prisma.$disconnect());
