import prisma from './lib/prisma';

async function main() {
    const msgs = await prisma.message.findMany({
        orderBy: { timestamp: 'desc' },
        take: 15,
        select: { id: true, chatId: true, fromMe: true, body: true, timestamp: true }
    });

    const ucs = await prisma.userChat.findMany({
        take: 20,
        select: { userId: true, chatId: true }
    });

    console.log('\n=== LAST 15 MESSAGES IN DB ===');
    if (msgs.length === 0) {
        console.log('NO MESSAGES FOUND IN DATABASE!');
    } else {
        msgs.forEach(m => {
            const date = new Date(m.timestamp * 1000).toLocaleString('pt-BR');
            console.log(`[${m.fromMe ? 'SENT' : 'RECV'}] chatId="${m.chatId}" body="${m.body.substring(0, 40)}" time=${date}`);
        });
    }

    console.log('\n=== USER CHATS (ownership) ===');
    if (ucs.length === 0) {
        console.log('NO USER CHATS FOUND!');
    } else {
        ucs.forEach(u => console.log(`userId=${u.userId} chatId="${u.chatId}"`));
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
