import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');
    let client = await prisma.client.findFirst({ where: { name: 'Frontend React App' } });
    
    if (!client) {
        client = await prisma.client.create({
            data: {
                name: 'Frontend React App'
            }
        });
        console.log(`Created new client: ${client.name}`);
    } else {
        console.log(`Client already exists: ${client.name}`);
    }
    
    console.log('\n=============================================');
    console.log('Use este API KEY en el frontend:');
    console.log(`VITE_NEXUS_API_KEY=${client.apiKey}`);
    console.log('=============================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
