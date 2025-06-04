const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolver'); // This will be your combined resolvers
const { authenticateContext } = require('./middleware/auth'); // For setting up context
// const db = require('./config/database'); // Already imported in index.js usually

async function startApolloServer() {
    const app = express();

    // Middleware (if any, e.g., for logging, body parsing if not using Apollo's default)
    app.use(express.json()); // If you have REST endpoints alongside GraphQL

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: authenticateContext, // Function to populate context for each request
        // introspection: process.env.NODE_ENV !== 'production', // Disable introspection in production for security
        // playground: process.env.NODE_ENV !== 'production', // Disable playground in production
        formatError: (err) => {
            // Don't strip out all error details in development for easier debugging
            if (process.env.NODE_ENV !== 'production') {
                console.error(err); // Log the full error server-side
                // return err; // Return full error to client in dev
            }
            // Customize error format for clients
            // Be careful not to leak sensitive information
            return {
                message: err.message,
                locations: err.locations,
                path: err.path,
                extensions: err.extensions,
            };
        },
    });

    await server.start();
    server.applyMiddleware({ app, path: '/graphql' }); // Default path is /graphql

    // Example REST endpoint (optional)
    app.get('/', (req, res) => {
        res.send('Hello from Express with Apollo Server!');
    });

    return app; // Return the app instance
}

module.exports = { startApolloServer };