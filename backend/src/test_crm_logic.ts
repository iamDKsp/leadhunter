import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USER CHECK ---');

    const users = await prisma.user.findMany({
        where: { email: { contains: 'tarcisio' } }
    });

    console.log(`Found ${users.length} users matching 'tarcisio'.`);
    users.forEach(u => {
        console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, ID: ${u.id}`);
    });

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
