const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Gerando dados mock para a versão mobile...');

    // 1. Localizar usuário tarcisio
    const tarcisio = await prisma.user.findUnique({
        where: { email: 'tarcisio@teltech.com' }
    });

    if (!tarcisio) {
        console.error('❌ Usuário tarcisio@teltech.com não encontrado');
        return;
    }

    const userId = tarcisio.id;

    // 2. Criar ou atualizar pastas de exemplo
    const folderVip = await prisma.folder.upsert({
        where: { id: 'folder-vip-leads' },
        update: {},
        create: {
            id: 'folder-vip-leads',
            name: 'Leads VIP Alta Prioridade',
            color: '#10B981',
            userId: userId
        }
    });

    const folderGeral = await prisma.folder.upsert({
        where: { id: 'folder-geral-mobile' },
        update: {},
        create: {
            id: 'folder-geral-mobile',
            name: 'Prospecção Geral',
            color: '#06B6D4',
            userId: userId
        }
    });

    // 3. Mock leads com dados ricos e realistas para B2B / Lead Hunter
    const mockLeads = [
        {
            id: 'lead-mob-01',
            name: 'Studio Premium Barbearia & Spa',
            phone: '(14) 99812-4433',
            email: 'contato@studiopremium.com.br',
            type: 'barbearia',
            activityBranch: 'servicos',
            size: 'medio',
            location: 'Bauru, SP',
            address: 'Av. Getúlio Vargas, 14-30 - Jardim América, Bauru - SP',
            latitude: -22.3421,
            longitude: -49.0681,
            successChance: 95,
            value: 8500.0,
            status: 'ACTIVE',
            contacted: true,
            stageId: 'fechamento',
            tips: 'Proprietário muito receptivo a automação de agendamentos e CRM via WhatsApp.',
            website: 'https://studiopremium.com.br',
            comments: 'Proposta de R$ 8.500 enviada em 15/08. Aguardando assinatura de contrato.',
            photoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=80',
            folderId: folderVip.id,
            responsibleId: userId,
        },
        {
            id: 'lead-mob-02',
            name: 'Auto Detail Lava Car & Estética',
            phone: '(14) 99771-8899',
            email: 'gerencia@autodetaillavacar.com.br',
            type: 'lavacar',
            activityBranch: 'servicos',
            size: 'grande',
            location: 'Bauru, SP',
            address: 'Rua Gustavo Maciel, 22-15 - Altos da Cidade, Bauru - SP',
            latitude: -22.3312,
            longitude: -49.0715,
            successChance: 90,
            value: 12400.0,
            status: 'ACTIVE',
            contacted: true,
            stageId: 'apresentacao',
            tips: 'Possui 3 unidades. Alto volume de clientes diários, precisando de captura automática de leads.',
            website: 'https://autodetailbauru.com.br',
            comments: 'Apresentação remota realizada com sucesso com o sócio-diretor.',
            photoUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&auto=format&fit=crop&q=80',
            folderId: folderVip.id,
            responsibleId: userId,
        },
        {
            id: 'lead-mob-03',
            name: 'Restaurante & Chopperia Vila Madalena',
            phone: '(14) 99123-5566',
            email: 'reservas@vilamadalena.com.br',
            type: 'restaurante',
            activityBranch: 'comercio',
            size: 'grande',
            location: 'Bauru, SP',
            address: 'Av. Comendador José da Silva Martha, 8-40 - Jardim Estoril, Bauru - SP',
            latitude: -22.3489,
            longitude: -49.0792,
            successChance: 85,
            value: 15800.0,
            status: 'ACTIVE',
            contacted: true,
            stageId: 'apresentacao',
            tips: 'Interesse em disparos automáticos de promoções de fim de semana e cardápio digital.',
            website: 'https://vilamadalena.com.br',
            comments: 'Reunião agendada com o gerente comercial para validação do escopo.',
            photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80',
            folderId: folderVip.id,
            responsibleId: userId,
        },
        {
            id: 'lead-mob-04',
            name: 'Espaço Bella Mulher Salão & Estética',
            phone: '(14) 99654-3210',
            email: 'contato@espacobellamulher.com.br',
            type: 'salao',
            activityBranch: 'servicos',
            size: 'medio',
            location: 'Bauru, SP',
            address: 'Rua Araújo Leite, 18-50 - Centro, Bauru - SP',
            latitude: -22.3255,
            longitude: -49.0734,
            successChance: 80,
            value: 6200.0,
            status: 'ACTIVE',
            contacted: true,
            stageId: 'abordagem',
            tips: 'Quer integrar agendamento online com confirmação automática pelo WhatsApp.',
            website: '',
            comments: 'Primeiro contato realizado. Enviado material explicativo e vídeo de demonstração.',
            photoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=80',
            folderId: folderGeral.id,
            responsibleId: userId,
        },
        {
            id: 'lead-mob-05',
            name: 'Blindagem & Concertinas Segurança Total',
            phone: '(14) 99888-1122',
            email: 'comercial@segurancatotal.com.br',
            type: 'concertinas',
            activityBranch: 'industria',
            size: 'grande',
            location: 'Bauru, SP',
            address: 'Rodovia Marechal Rondon, Km 340 - Distrito Industrial, Bauru - SP',
            latitude: -22.3110,
            longitude: -49.0512,
            successChance: 75,
            value: 19500.0,
            status: 'ACTIVE',
            contacted: true,
            stageId: 'abordagem',
            tips: 'Foco em condomínios e galpões logísticos. Alto ticket médio.',
            website: 'https://segurancatotal.com.br',
            comments: 'Ligação com o diretor de operações. Pediu proposta customizada.',
            photoUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=400&auto=format&fit=crop&q=80',
            folderId: folderVip.id,
            responsibleId: userId,
        },
        {
            id: 'lead-mob-06',
            name: 'Clínica Sorriso & Saúde Odontologia',
            phone: '(14) 99744-9988',
            email: 'atendimento@sorrisosaude.com.br',
            type: 'outros',
            activityBranch: 'saude',
            size: 'medio',
            location: 'Bauru, SP',
            address: 'Rua Antônio Alves, 25-10 - Vila Universitária, Bauru - SP',
            latitude: -22.3388,
            longitude: -49.0621,
            successChance: 70,
            value: 7800.0,
            status: 'ACTIVE',
            contacted: false,
            stageId: 'prospeccao',
            tips: 'Clínica com 5 dentistas, precisam de funil de confirmação de consultas e reativação de pacientes.',
            website: 'https://sorrisosaude.com.br',
            comments: 'Lead qualificado importado recentemente da base do Google Maps.',
            photoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop&q=80',
            folderId: folderGeral.id,
            responsibleId: userId,
        },
        {
            id: 'lead-mob-07',
            name: 'Boutique do Corte Barber Shop',
            phone: '(14) 99188-7744',
            email: 'boutiquedocorte@gmail.com',
            type: 'barbearia',
            activityBranch: 'servicos',
            size: 'pequeno',
            location: 'Bauru, SP',
            address: 'Rua Treze de Maio, 10-22 - Centro, Bauru - SP',
            latitude: -22.3219,
            longitude: -49.0755,
            successChance: 88,
            value: 4500.0,
            status: 'ACTIVE',
            contacted: true,
            stageId: 'fechamento',
            tips: 'Excelente engajamento no Instagram. Quer automatizar respostas e links de pagamento.',
            website: '',
            comments: 'Contrato pré-aprovado. Aguardando dados bancários para fechar.',
            photoUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop&q=80',
            folderId: folderVip.id,
            responsibleId: userId,
        },
        {
            id: 'lead-mob-08',
            name: 'EcoWash Limpeza Automotiva Sustentável',
            phone: '(14) 99833-2211',
            email: 'contato@ecowashbauru.com.br',
            type: 'lavacar',
            activityBranch: 'servicos',
            size: 'pequeno',
            location: 'Bauru, SP',
            address: 'Av. Nossa Senhora de Fátima, 11-45 - Jardim América, Bauru - SP',
            latitude: -22.3456,
            longitude: -49.0645,
            successChance: 65,
            value: 3900.0,
            status: 'ACTIVE',
            contacted: false,
            stageId: 'prospeccao',
            tips: 'Lavagem a seco com foco em delivery empresarial.',
            website: '',
            comments: 'Lead capturado da busca de lava-rápidos da região.',
            photoUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&auto=format&fit=crop&q=80',
            folderId: folderGeral.id,
            responsibleId: userId,
        }
    ];

    for (const lead of mockLeads) {
        await prisma.company.upsert({
            where: { id: lead.id },
            update: lead,
            create: lead
        });
    }
    console.log(`✅ ${mockLeads.length} leads mock criados/atualizados para ${tarcisio.email}`);

    // 4. Atribuir também alguns dos leads existentes para Tarcisio
    await prisma.company.updateMany({
        where: {
            id: {
                in: [
                    '7a729c54-2b76-49db-b8d3-9cc57f819196',
                    '9f054af2-8887-408a-8694-6d504d68ad20',
                    '4ecae5f6-5dec-48df-acc9-d0586e252bbd',
                    'd721e7ed-6771-4ab8-892c-e9dabcfc189d',
                    'e110458c-8b00-4068-bcc3-a14d8e6e6545'
                ]
            }
        },
        data: {
            responsibleId: userId,
            value: 5200.0,
            successChance: 82,
            contacted: true
        }
    });
    console.log('✅ Leads existentes reatribuídos e enriquecidos com valores');

    // 5. Criar Tarefas no banco de dados para o módulo pessoal/mobile
    const mockTasks = [
        {
            id: 'task-mob-01',
            title: 'Ligar para apresentar proposta comercial',
            description: 'Apresentar escopo completo de automação e fechar contrato de R$ 8.500',
            companyId: 'lead-mob-01',
            userId: userId,
            priority: 'high',
            type: 'call',
            completed: false,
            dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000)
        },
        {
            id: 'task-mob-02',
            title: 'Enviar orçamento detalhado por e-mail',
            description: 'Especificar tabela de 3 unidades e desconto progressivo',
            companyId: 'lead-mob-02',
            userId: userId,
            priority: 'medium',
            type: 'email',
            completed: false,
            dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000)
        },
        {
            id: 'task-mob-03',
            title: 'Agendar reunião de demonstração técnica',
            description: 'Demonstrar envio de cardápio e promoções de final de semana',
            companyId: 'lead-mob-03',
            userId: userId,
            priority: 'high',
            type: 'meeting',
            completed: false,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
            id: 'task-mob-04',
            title: 'Enviar mensagem de follow-up no WhatsApp',
            description: 'Perguntar se tiveram dúvidas sobre o material explicativo',
            companyId: 'lead-mob-04',
            userId: userId,
            priority: 'medium',
            type: 'message',
            completed: false,
            dueDate: new Date(Date.now() + 28 * 60 * 60 * 1000)
        },
        {
            id: 'task-mob-05',
            title: 'Apresentação comercial inicial realizada',
            description: 'Apresentação de fechamento efetuada com sucesso',
            companyId: 'lead-mob-07',
            userId: userId,
            priority: 'high',
            type: 'meeting',
            completed: true,
            dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
    ];

    for (const task of mockTasks) {
        await prisma.task.upsert({
            where: { id: task.id },
            update: task,
            create: task
        });
    }
    console.log(`✅ ${mockTasks.length} tarefas mock criadas/atualizadas`);

    // 6. Criar Metas no banco de dados
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);

    const mockGoals = [
        {
            id: 'goal-mob-01',
            userId: userId,
            title: 'Novos Leads Ativos',
            target: 15,
            current: 13,
            unit: 'leads',
            icon: 'leads',
            weekStart: weekStart
        },
        {
            id: 'goal-mob-02',
            userId: userId,
            title: 'Contatos e Ligações',
            target: 10,
            current: 8,
            unit: 'calls',
            icon: 'calls',
            weekStart: weekStart
        },
        {
            id: 'goal-mob-03',
            userId: userId,
            title: 'Propostas e Fechamentos',
            target: 5,
            current: 4,
            unit: 'sales',
            icon: 'sales',
            weekStart: weekStart
        }
    ];

    for (const goal of mockGoals) {
        await prisma.goal.upsert({
            where: { id: goal.id },
            update: goal,
            create: goal
        });
    }
    console.log(`✅ ${mockGoals.length} metas semanais mock criadas`);

    console.log('🎉 Mock data gerado com sucesso para a versão mobile!');
}

main()
    .catch((e) => {
        console.error('❌ Erro gerando mock data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
