const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: { contains: 'Deborah' } },
        include: {
            accessGroup: {
                include: { permissions: true }
            }
        }
    });

    if (!user) {
        console.log('User Deborah not found');
        return;
    }

    console.log('User:', {
        id: user.id,
        name: user.name,
        role: user.role,
        useOwnWhatsApp: user.useOwnWhatsApp,
        accessGroupName: user.accessGroup?.name
    });

    console.log('Permissions:', user.accessGroup?.permissions);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
