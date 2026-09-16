import { PrismaClient, LoginStatus, Provider } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createDemoData() {
    console.log('--- Iniciando generación de datos ficticios multicliente ---');

    const defaultPasswordHash = await bcrypt.hash('Password123!@#', 10);

    // 1. Crear Sistemas Clientes de prueba
    console.log('1. Creando o buscando sistemas cliente de prueba...');

    let clientAlfa = await prisma.client.findFirst({ where: { name: 'Portal Corporativo Alfa' } });
    if (!clientAlfa) {
        clientAlfa = await prisma.client.create({
            data: {
                name: 'Portal Corporativo Alfa',
                allowedOrigins: ['http://localhost:4000', 'https://alfa.corporativo.com']
            }
        });
        console.log(` Cliente creado: ${clientAlfa.name} (API Key: ${clientAlfa.apiKey})`);
    } else {
        console.log(` Cliente existente: ${clientAlfa.name}`);
    }

    let clientBeta = await prisma.client.findFirst({ where: { name: 'Tienda Online Beta' } });
    if (!clientBeta) {
        clientBeta = await prisma.client.create({
            data: {
                name: 'Tienda Online Beta',
                allowedOrigins: ['http://localhost:5000', 'https://tienda-beta.com']
            }
        });
        console.log(` Cliente creado: ${clientBeta.name} (API Key: ${clientBeta.apiKey})`);
    } else {
        console.log(` Cliente existente: ${clientBeta.name}`);
    }

    // Asegurar usuario Super Administrador en el cliente principal
    const defaultClient = await prisma.client.findFirst({ where: { name: 'Frontend React App' } }) || clientAlfa;
    if (defaultClient) {
        let superAdminUser = await prisma.user.findFirst({
            where: { email: 'admin@nexusauth.com', clientId: defaultClient.id }
        });
        if (!superAdminUser) {
            await prisma.user.create({
                data: {
                    email: 'admin@nexusauth.com',
                    passwordHash: defaultPasswordHash,
                    clientId: defaultClient.id,
                    mfaEnabled: false
                }
            });
            console.log(` SuperAdmin registrado: admin@nexusauth.com (Password: Password123!@#)`);
        } else {
            await prisma.user.update({
                where: { id: superAdminUser.id },
                data: { passwordHash: defaultPasswordHash }
            });
            console.log(` SuperAdmin actualizado: admin@nexusauth.com (Password: Password123!@#)`);
        }
    }

    // Datos de usuarios para cada cliente
    const clientsData = [
        {
            client: clientAlfa,
            users: [
                { email: 'carlos.mendoza@alfa.com', mfa: true, oauth: null, hasPwChange: true },
                { email: 'ana.torres@alfa.com', mfa: false, oauth: null, hasPwChange: false },
                { email: 'luis.ramirez@alfa.com', mfa: false, oauth: null, hasPwChange: true },
                { email: 'mariana.lopez@alfa.com', mfa: false, oauth: Provider.GOOGLE, hasPwChange: false },
                { email: 'jorge.diaz@alfa.com', mfa: true, oauth: Provider.GITHUB, hasPwChange: false },
            ]
        },
        {
            client: clientBeta,
            users: [
                { email: 'sofia.martinez@beta.com', mfa: false, oauth: null, hasPwChange: false },
                { email: 'diego.herrera@beta.com', mfa: true, oauth: null, hasPwChange: true },
                { email: 'valeria.castro@beta.com', mfa: false, oauth: null, hasPwChange: true },
                { email: 'roberto.gomez@beta.com', mfa: false, oauth: Provider.FACEBOOK, hasPwChange: false },
                { email: 'camila.navarro@beta.com', mfa: true, oauth: Provider.GOOGLE, hasPwChange: false },
            ]
        }
    ];

    const browsers = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
    ];

    const ips = ['190.158.45.12', '181.129.78.24', '201.244.112.5', '190.235.10.88', '186.84.90.15'];
    const locations = [
        { name: 'Bogotá, Colombia', lat: 4.7110, lon: -74.0721 },
        { name: 'Ciudad de México, México', lat: 19.4326, lon: -99.1332 },
        { name: 'Madrid, España', lat: 40.4168, lon: -3.7038 },
        { name: 'Lima, Perú', lat: -12.0464, lon: -77.0428 },
        { name: 'Buenos Aires, Argentina', lat: -34.6037, lon: -58.3816 }
    ];

    let totalUsersCreated = 0;
    let totalLogsCreated = 0;
    let totalPwChanges = 0;

    for (const group of clientsData) {
        console.log(`\n2. Registrando usuarios y logs para: ${group.client.name}...`);

        for (const u of group.users) {
            // Buscar o crear usuario
            let user = await prisma.user.findUnique({
                where: {
                    email_clientId: {
                        email: u.email,
                        clientId: group.client.id
                    }
                }
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: u.email,
                        passwordHash: u.oauth ? null : defaultPasswordHash,
                        mfaEnabled: u.mfa,
                        clientId: group.client.id,
                        passwordChangedAt: u.hasPwChange ? new Date(Date.now() - Math.floor(Math.random() * 86400000 * 5)) : null
                    }
                });

                // Si es OAuth, agregar el proveedor
                if (u.oauth) {
                    await prisma.oAuthProvider.create({
                        data: {
                            provider: u.oauth,
                            providerId: `demo-${u.oauth.toLowerCase()}-${user.id.substring(0, 8)}`,
                            userId: user.id
                        }
                    });
                }

                // Si tiene cambio de contraseña, agregar log
                if (u.hasPwChange) {
                    await prisma.passwordChangeLog.create({
                        data: {
                            userId: user.id,
                            clientId: group.client.id,
                            ipAddress: ips[Math.floor(Math.random() * ips.length)],
                            userAgent: browsers[0],
                            createdAt: user.passwordChangedAt || new Date()
                        }
                    });
                    totalPwChanges++;
                }

                totalUsersCreated++;
                console.log(`   + Usuario registrado: ${user.email} (MFA: ${u.mfa ? 'Sí' : 'No'}, Tipo: ${u.oauth || 'Email'})`);
            } else {
                console.log(`   = Usuario ya existente: ${user.email}`);
            }

            // Generar entre 2 y 5 logs para este usuario
            const logsCount = Math.floor(Math.random() * 4) + 2; // entre 2 y 5
            for (let i = 0; i < logsCount; i++) {
                const daysAgo = Math.floor(Math.random() * 15); // en los últimos 15 días
                const hoursAgo = Math.floor(Math.random() * 24);
                const logDate = new Date(Date.now() - (daysAgo * 86400000) - (hoursAgo * 3600000));

                const isSuccess = Math.random() > 0.2; // 80% de éxito, 20% fallido
                const randomIdx = Math.floor(Math.random() * ips.length);

                const loc = locations[randomIdx];
                await prisma.loginLog.create({
                    data: {
                        status: isSuccess ? LoginStatus.SUCCESS : LoginStatus.FAILED,
                        userId: user.id,
                        clientId: group.client.id,
                        ipAddress: ips[randomIdx],
                        userAgent: browsers[randomIdx],
                        location: loc.name,
                        latitude: loc.lat,
                        longitude: loc.lon,
                        createdAt: logDate
                    }
                });
                totalLogsCreated++;
            }
        }
    }

    console.log('\n--- Generación completada con éxito ---');
    console.log(`• Nuevos Usuarios creados: ${totalUsersCreated}`);
    console.log(`• Registros de Login generados: ${totalLogsCreated}`);
    console.log(`• Registros de Cambio de Contraseña: ${totalPwChanges}`);
    console.log('----------------------------------------\n');
}

createDemoData()
    .catch((err) => {
        console.error('Error al generar datos ficticios:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
