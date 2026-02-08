const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, photoUrl: true, googlePlaceId: true }
    });

    console.log('=== Recent Companies ===');
    companies.forEach(c => {
        console.log(`Name: ${c.name}`);
        console.log(`ID: ${c.id}`);
        console.log(`Google Place ID: ${c.googlePlaceId}`);
        console.log(`Photo URL: ${c.photoUrl || 'NULL'}`);
        console.log('---');
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => { console.error(e); prisma.$disconnect(); });
