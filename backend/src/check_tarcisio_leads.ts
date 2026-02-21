import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CHECKING ASSIGNED LEADS ---');
  
  const user = await prisma.user.findFirst({
      where: { email: { contains: 'tarcisio' } } 
  });

  if (!user) {
      console.log('User Tarcisio not found');
      return;
  }

  console.log(`User: ${user.name} (${user.id}) Role: ${user.role}`);

  const assignedCount = await prisma.company.count({
      where: { responsibleId: user.id }
  });

  console.log(`Leads explicitly assigned to Tarcisio (responsibleId): ${assignedCount}`);

  // Also check if he is in the "LeadAssignmentHistory" just in case, but CRM usually filters by current responsibleId
  
  console.log('--- END ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
