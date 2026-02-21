import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- UPDATING TARCISIO ROLE ---');

    const user = await prisma.user.findFirst({
        where: { email: { contains: 'tarcisio' } }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`Current Role: ${user.role}`);

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SELLER' }
    });

    console.log(`New Role: ${updated.role}`);
    console.log('--- UPDATE COMPLETE ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
