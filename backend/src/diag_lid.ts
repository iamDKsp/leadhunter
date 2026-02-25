import prisma from './lib/prisma';

async function main() {
    const msgs = await prisma.message.findMany({
        where: { chatId: { contains: '@lid' } },
        orderBy: { timestamp: 'desc' },
        take: 5
    });

    console.log("=== @lid Messages ===");
    console.log(JSON.stringify(msgs, null, 2));

    await prisma.$disconnect();
}
main().catch(console.error);
