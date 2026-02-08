const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Check using the actual model names from schema (Company, not Lead)
    const users = await prisma.user.count();
    const companies = await prisma.company.count();
    const folders = await prisma.folder.count();

    console.log('=== Database Status ===');
    console.log('Users:', users);
    console.log('Companies (Leads):', companies);
    console.log('Folders:', folders);

    if (users > 0) {
        const userList = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true }
        });
        console.log('\nUser list:');
        userList.forEach(u => console.log(`  - ${u.name || u.email} (${u.role})`));
    }

    if (companies > 0) {
        const companyList = await prisma.company.findMany({
            take: 5,
            select: { id: true, name: true, phone: true }
        });
        console.log('\nFirst 5 companies:');
        companyList.forEach(c => console.log(`  - ${c.name}: ${c.phone}`));
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => { console.error(e); prisma.$disconnect(); });
