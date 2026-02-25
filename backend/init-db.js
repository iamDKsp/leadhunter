const fs = require('fs');
const path = require('path');

const repoDbPath = path.join(__dirname, 'prisma', 'dev.db');
const defaultTargetDb = '/app/dev.db';

// Safely extract the target path from DATABASE_URL
let targetDbPath = process.env.DATABASE_URL || defaultTargetDb;
if (targetDbPath.startsWith('file:')) {
    targetDbPath = targetDbPath.replace('file:', '');
}

console.log('🔄 Initializing Database Copy Check...');
console.log('📦 Source DB (from Repo):', repoDbPath);
console.log('🎯 Target DB (in Volume):', targetDbPath);

try {
    if (fs.existsSync(repoDbPath)) {
        const repoStats = fs.statSync(repoDbPath);
        console.log(`📊 Source DB Size: ${repoStats.size} bytes`);

        if (fs.existsSync(targetDbPath)) {
            const targetStats = fs.statSync(targetDbPath);
            console.log(`📊 Target DB Size: ${targetStats.size} bytes`);

            // Se o volume estiver vazio ou com um DB virgem criado pelo prisma 
            // E o repo tiver o backup original do usuario
            if (targetStats.size <= repoStats.size && targetStats.size < 150000) {
                console.log('⚠️ Target DB appears empty or just initialized. Restoring from repository...');
                fs.copyFileSync(repoDbPath, targetDbPath);
                console.log('✅ Successfully restored user data from repository to the volume!');
            } else {
                console.log('✅ Target DB already has data. Skipping restore to protect live data.');
            }
        } else {
            console.log('⚠️ Target DB does not exist in volume. Copying from repository...');
            const targetDir = path.dirname(targetDbPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            fs.copyFileSync(repoDbPath, targetDbPath);
            console.log('✅ Successfully copied Database to volume!');
        }
    } else {
        console.log('⚠️ No source DB found in repository. Proceeding with empty database creation.');
    }
} catch (err) {
    console.error('❌ Error during database initialization:', err);
}
