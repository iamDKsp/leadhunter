
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("=== Debugging Chat Visibility (Refined) ===");

    // 1. Check for Duplicate Leads named "Pods"
    const leads = await prisma.company.findMany({
        where: { name: { contains: 'Pods' } },
        include: { users: true }
    });

    console.log(`Found ${leads.length} leads matching 'Pods':`);

    for (const lead of leads) {
        console.log(`\n------------------------------------------------`);
        console.log(`Lead ID: ${lead.id}`);
        console.log(`Name: ${lead.name}`);
        console.log(`Phone: ${lead.phone}`);
        console.log(`Assigned Users: ${lead.users.map(u => u.name).join(', ')}`);

        const cleanPhone = lead.phone?.replace(/\D/g, '');
        console.log(`Clean Phone: ${cleanPhone}`);

        // Check for messages for this phone
        if (cleanPhone) {
            const chatIds = [
                `${cleanPhone}@c.us`,
                `55${cleanPhone}@c.us`,
                `${cleanPhone.replace(/^55/, '')}@c.us`
            ];
            const msgCount = await prisma.message.count({
                where: { chatId: { in: chatIds } }
            });
            console.log(`Messages in DB for this phone: ${msgCount}`);
        }
    }

    console.log(`\n------------------------------------------------`);

    // 2. Check Tarcisio
    const tarcisio = await prisma.user.findFirst({
        where: { name: { contains: 'Tarcisio' } },
        include: { assignedLeads: true }
    });

    if (tarcisio) {
        console.log(`User Tarcisio found (ID: ${tarcisio.id})`);
        console.log(`Total Assigned Leads: ${tarcisio.assignedLeads.length}`);
        const assignedPods = tarcisio.assignedLeads.filter(l => l.name.includes('Pods'));
        console.log(`Assigned Leads matching 'Pods':`);
        assignedPods.forEach(l => console.log(`- ${l.name} (${l.phone})`));
        if (assignedPods.length === 0) console.log("NONE");
    } else {
        console.log("User Tarcisio NOT found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
