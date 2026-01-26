import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany();
    console.log(`Found ${companies.length} companies.`);
    companies.forEach(c => {
        console.log(`- ${c.name}: ID=${c.id}, googlePlaceId=${c.googlePlaceId}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
