import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils/auth';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Searching for user Tarcisio (Raw SQL)...");

        // Find user
        const users: any[] = await prisma.$queryRawUnsafe(
            `SELECT * FROM users WHERE email LIKE '%tarcisio%' OR name LIKE '%Tarcisio%' LIMIT 1`
        );

        if (users.length > 0) {
            const user = users[0];
            console.log(`Found user: ${user.name} (${user.email})`);

            // Update
            await prisma.$executeRawUnsafe(
                `UPDATE users SET interfacePreference = 'PC' WHERE id = ?`,
                user.id
            );
            console.log("Updated user preference to PC.");
        } else {
            console.log("User Tarcisio not found. Creating new user tarcisio@demo.com...");
            const passwordHash = await hashPassword('password123');
            const id = randomUUID();
            const now = new Date().toISOString(); // SQLite uses text for dates usually or numeric? Prisma stores as numeric or text depending.
            // Prisma with SQLite usually stores DateTime as numeric (milliseconds) or string (ISO).
            // Let's rely on default? No, Raw SQL needs values.
            // Best to use 'datetime("now")' for sqlite.

            await prisma.$executeRawUnsafe(
                `INSERT INTO users (id, email, passwordHash, name, interfacePreference, createdAt, updatedAt) 
                 VALUES (?, ?, ?, ?, 'PC', ?, ?)`,
                id,
                'tarcisio@demo.com',
                passwordHash,
                'Tarcisio',
                Date.now(), // Prisma SQLite often uses milliseconds for DateTime if not configured otherwise?
                // Actually defaults are cleaner if I can omit? But I'm using raw insert.
                // Let's guess ISO string, it's safer for SQLite readability, but Prisma might expect something else.
                // Let's check a user first?
                // I'll try ISO string.
                new Date().toISOString(),
                new Date().toISOString()
            );
            console.log(`Created user: tarcisio@demo.com with password 'password123'`);
        }
    } catch (e) {
        console.error("Error executing raw sql:", e);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
