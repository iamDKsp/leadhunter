import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils/auth';

const prisma = new PrismaClient();

async function main() {
    const email = 'tarcisio@demo.com'; // Assumption based on common patterns or I can search for "tarcisio" again but I got nothing. 
    // Wait, if "tarcisio" is just a name, I should look for a user with name "Tarcisio" or similar?
    // The user said "O usuário, tarcisio".
    // I'll try to find by name "Tarcisio" first.

    console.log("Searching for user Tarcisio...");

    let user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'Tarcisio' } }, // Case insensitive usually depends on DB, but SQLite is case insensitive for ASCII
                { email: { contains: 'tarcisio' } }
            ]
        }
    });

    if (user) {
        console.log(`Found user: ${user.name} (${user.email})`);
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                interfacePreference: 'PC'
            }
        });
        console.log("Updated user preference to PC.");
    } else {
        console.log("User Tarcisio not found. Creating new user tarcisio@demo.com...");
        const passwordHash = await hashPassword('password123'); // Default password
        const newUser = await prisma.user.create({
            data: {
                name: 'Tarcisio',
                email: 'tarcisio@demo.com',
                passwordHash,
                interfacePreference: 'PC'
            }
        });
        console.log(`Created user: ${newUser.email} with password 'password123'`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
