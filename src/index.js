require('dotenv').config();
const { startApolloServer } = require('./server');
const prisma = require('./config/prisma'); // Import Prisma client

const port = process.env.PORT || 4000;

async function main() {
    try {
        // Prisma Client connects lazily, so no explicit connect() call is usually needed here.
        // You can add a simple query to test if needed, but it's often not necessary.
        // e.g., await prisma.$connect(); console.log('🎉 Connected to database via Prisma');

        const app = await startApolloServer();

        app.listen(port, () => {
            console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
            console.log(`📚 Prisma Studio: http://localhost:5555 (run 'npx prisma studio')`);
        });
    } catch (error) {
        console.error('💀 Failed to start the server:', error);
        // await prisma.$disconnect(); // Ensure Prisma disconnects on error
        process.exit(1);
    }
}

main();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server and DB connection');
    // await prisma.$disconnect(); // Disconnect Prisma
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server and DB connection');
    // await prisma.$disconnect();
    process.exit(0);
});