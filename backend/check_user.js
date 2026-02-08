const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    // Update tarcisio to SUPER_ADMIN
    const result = await p.user.update({
        where: { email: 'tarcisio@teltech.com' },
        data: { role: 'SUPER_ADMIN' }
    });
    console.log('Updated tarcisio to SUPER_ADMIN:', result.email, result.role);
}

main()
    .catch(e => console.error(e))
    .finally(() => p.$disconnect());
