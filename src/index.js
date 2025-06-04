require('dotenv').config();
const { startApolloServer } = require('./server');
const db = require('./config/database');

const port = process.env.PORT || 4000;

async function main() {
    try {
        // You might want to test the database connection here before starting the server
        await db.getConnection(); // Example: if using mariadb pool directly
        console.log('🎉 Connected to MariaDB successfully!');

        const app = await startApolloServer();

        app.listen(port, () => {
            console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
        });
    } catch (error) {
        console.error('💀 Failed to start the server or connect to the database:', error);
        process.exit(1);
    }
}

main();