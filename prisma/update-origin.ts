import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const origin = 'http://localhost:5173';
    
    // Buscar el cliente "Frontend React App"
    const client = await prisma.client.findFirst({
        where: { name: 'Frontend React App' }
    });

    if (client) {
        await prisma.client.update({
            where: { id: client.id },
            data: {
                allowedOrigins: [origin]
            }
        });
        console.log(`Origen '${origin}' agregado correctamente al cliente: ${client.name} (API Key: ${client.apiKey})`);
    } else {
        console.log('No se encontró el cliente "Frontend React App" en la base de datos.');
    }
}

main()
  .catch(console.error)
  .finally(async () => {
      await prisma.$disconnect();
  });
