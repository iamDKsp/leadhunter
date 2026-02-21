
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    try {
        console.log('Starting stage migration...');

        const validStages = ['prospeccao', 'abordagem', 'apresentacao', 'fechamento'];

        const result = await prisma.company.updateMany({
            where: {
                stageId: {
                    notIn: validStages
                }
            },
            data: {
                stageId: 'prospeccao'
            }
        });

        console.log(`Updated ${result.count} leads to 'prospeccao' stage.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
