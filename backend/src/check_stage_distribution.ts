import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const totalActive = await prisma.company.count({ where: { status: 'ACTIVE' } });
    const totalTriage = await prisma.company.count({ where: { status: 'TRIAGE' } });
    const totalOther = await prisma.company.count({ where: { status: { notIn: ['ACTIVE', 'TRIAGE'] } } });
    console.log(`Active Leads: ${totalActive}, Triage Leads: ${totalTriage}, Other Leads: ${totalOther}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
