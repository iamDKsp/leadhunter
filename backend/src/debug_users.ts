import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Users & Permissions ---');

    const users = await prisma.user.findMany({
        include: {
            accessGroup: {
                include: { permissions: true }
            },
            assignedLeads: {
                select: { id: true, name: true, phone: true }
            }
        }
    });

    for (const user of users) {
        console.log(`\nUser: ${user.name} (${user.email})`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Access Group: ${user.accessGroup?.name || 'None'}`);

        // Check Permissions logic simulation
        let canViewAll = false;
        if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
            canViewAll = true;
            console.log(`  canViewAllLeads: TRUE (Role Override)`);
        } else {
            canViewAll = user.accessGroup?.permissions?.canViewAllLeads || false;
            console.log(`  canViewAllLeads: ${canViewAll} (From Permissions)`);
        }

        console.log(`  Assigned Leads Count: ${user.assignedLeads.length}`);
        if (user.assignedLeads.length > 0) {
            console.log(`  Sample Assigned Leads: ${user.assignedLeads.slice(0, 3).map(l => l.name).join(', ')}`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
