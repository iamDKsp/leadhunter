import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de grupos de acesso...');

    // Criar grupo Administradores
    const adminGroup = await prisma.accessGroup.upsert({
        where: { name: 'Administradores' },
        update: {},
        create: {
            name: 'Administradores',
            description: 'Grupo com acesso total ao sistema',
            permissions: {
                create: {
                    canSearchLeads: true,
                    canViewAllLeads: true,
                    canViewOwnLeads: true,
                    canManageLeads: true,
                    canAssignLeads: true,
                    canViewCRM: true,
                    canViewDashboard: true,
                    canViewCosts: true,
                    canViewChat: true,
                    canManageUsers: true,
                    canManageGroups: true,
                    canManageFolders: true,
                }
            }
        }
    });
    console.log('✅ Grupo Administradores criado');

    // Criar grupo Vendedores
    const sellerGroup = await prisma.accessGroup.upsert({
        where: { name: 'Vendedores' },
        update: {},
        create: {
            name: 'Vendedores',
            description: 'Grupo de vendedores com acesso básico',
            permissions: {
                create: {
                    canSearchLeads: false,
                    canViewAllLeads: false,
                    canViewOwnLeads: true,
                    canManageLeads: false,
                    canAssignLeads: false,
                    canViewCRM: true,
                    canViewDashboard: true,
                    canViewCosts: false,
                    canViewChat: true,
                    canManageUsers: false,
                    canManageGroups: false,
                    canManageFolders: false,
                }
            }
        }
    });
    console.log('✅ Grupo Vendedores criado');

    // Criar grupo Supervisores
    const supervisorGroup = await prisma.accessGroup.upsert({
        where: { name: 'Supervisores' },
        update: {},
        create: {
            name: 'Supervisores',
            description: 'Supervisores podem ver todos os leads e atribuir',
            permissions: {
                create: {
                    canSearchLeads: true,
                    canViewAllLeads: true,
                    canViewOwnLeads: true,
                    canManageLeads: true,
                    canAssignLeads: true,
                    canViewCRM: true,
                    canViewDashboard: true,
                    canViewCosts: false,
                    canViewChat: true,
                    canManageUsers: false,
                    canManageGroups: false,
                    canManageFolders: true,
                }
            }
        }
    });
    console.log('✅ Grupo Supervisores criado');

    console.log('');
    console.log('🎉 Seed finalizado!');
    console.log('');
    console.log('Grupos criados:');
    console.log('  - Administradores: Acesso total');
    console.log('  - Supervisores: Ver todos leads, atribuir, gerenciar pastas');
    console.log('  - Vendedores: Ver apenas próprios leads');

    // Create admin user
    const adminPassword = await bcrypt.hash('123456', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'tarcisio@teltech.com' },
        update: {},
        create: {
            email: 'tarcisio@teltech.com',
            name: 'Tarcisio',
            passwordHash: adminPassword,
            role: 'SUPER_ADMIN',
            interfacePreference: 'BOTH',
            accessGroup: {
                connect: { name: 'Administradores' }
            }
        }
    });
    console.log('✅ Usuário Admin criado: tarcisio@teltech.com / 123456');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
