import { PrismaClient } from '@prisma/client';
import { hashPassword } from './src/utils/auth';

const prisma = new PrismaClient();

async function resetAdmin() {
    try {
        const email = 'tarcisio@teltech.com';
        const newPassword = '123';

        console.log(`Resetting password for ${email} to '${newPassword}'...`);

        const hash = await hashPassword(newPassword);

        const user = await prisma.user.update({
            where: { email },
            data: { passwordHash: hash }
        });

        console.log('Password updated successfully for user:', user.email);
        console.log('New hash:', hash);

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
