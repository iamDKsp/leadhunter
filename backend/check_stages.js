const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const stages = await p.stage.findMany({
        orderBy: { order: 'asc' }
    });
    console.log('Stages ordered:', JSON.stringify(stages, null, 2));
    await p.$disconnect();
}

main().catch(console.error);
