
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.company.count();
        console.log(`Total companies in DB: ${count}`);

        if (count > 0) {
            const companies = await prisma.company.findMany({ take: 5 });
            console.log('First 5 companies:', JSON.stringify(companies, null, 2));
        }

        const folderCount = await prisma.folder.count();
        console.log(`Total folders in DB: ${folderCount}`);
        if (folderCount > 0) {
            const folders = await prisma.folder.findMany({ take: 5 });
            console.log('First 5 folders:', JSON.stringify(folders, null, 2));
        }

    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
