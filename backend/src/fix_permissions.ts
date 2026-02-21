import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- CHECKING PERMISSIONS ---');

    const user = await prisma.user.findFirst({
        where: { email: { contains: 'tarcisio' } },
        include: {
            accessGroup: {
                include: { permissions: true }
            }
        }
    });

    if (!user) {
        console.log('User Tarcisio not found');
        return;
    }

    console.log(`User: ${user.name} (${user.role})`);
    console.log(`Access Group: ${user.accessGroup?.name || 'None'}`);

    if (user.accessGroup) {
        console.log('Current Permissions:', user.accessGroup.permissions);

        // Update to allow Viewing All Leads (for CRM)
        if (user.accessGroup.permissions) {
            const updated = await prisma.permission.update({
                where: { id: user.accessGroup.permissions.id },
                data: { canViewAllLeads: true }
            });
            console.log('Updated Permission canViewAllLeads to TRUE');
        }
    } else {
        console.log('User has no access group. Cannot set granular permissions.');
        // Create a temp group? Or just note it.
        // Usually users should have a group.
    }

    console.log('--- END ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
