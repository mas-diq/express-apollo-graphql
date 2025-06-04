const { GraphQLScalarType, Kind } = require('graphql');
const { v4: uuidv4, validate: uuidValidate, version: uuidVersion } = require('uuid');
const usersResolvers = require('./users');
const postsResolvers = require('./posts');
const db = require('../../config/database'); // Your database connection

// Custom UUID Scalar
const UUIDScalar = new GraphQLScalarType({
    name: 'UUID',
    description: 'UUID custom scalar type',
    serialize(value) { // Converts outgoing UUID to a client-readable format (string)
        if (typeof value === 'string' && uuidValidate(value) && uuidVersion(value) === 4) {
            return value;
        }
        // If it's a Buffer from MariaDB BINARY(16)
        if (Buffer.isBuffer(value) && value.length === 16) {
            // Convert BINARY(16) to UUID string
            return value.toString('hex', 0, 4) + '-' +
                value.toString('hex', 4, 6) + '-' +
                value.toString('hex', 6, 8) + '-' +
                value.toString('hex', 8, 10) + '-' +
                value.toString('hex', 10, 16);
        }
        throw new Error('GraphQL UUID Scalar serializer expected a valid UUID string or a 16-byte Buffer.');
    },
    parseValue(value) { // Converts client input (string) to its internal representation
        if (typeof value === 'string' && uuidValidate(value) && uuidVersion(value) === 4) {
            // For MariaDB with BINARY(16), you might want to convert it to a Buffer here
            // or handle it in the resolver before DB interaction.
            // For simplicity, we'll return the string and let resolvers handle conversion if needed.
            return value;
        }
        throw new Error('GraphQL UUID Scalar parser expected a valid UUID string.');
    },
    parseLiteral(ast) { // Converts AST value (string) to its internal representation
        if (ast.kind === Kind.STRING) {
            if (uuidValidate(ast.value) && uuidVersion(ast.value) === 4) {
                return ast.value; // Similar to parseValue, return string
            }
        }
        throw new Error('GraphQL UUID Scalar parser expected a valid UUID string literal.');
    },
});


const resolvers = {
    UUID: UUIDScalar,

    Query: {
        ...usersResolvers.Query,
        ...postsResolvers.Query,
    },
    Mutation: {
        ...usersResolvers.Mutation,
        ...postsResolvers.Mutation,
    },
    // Field-level resolvers for relationships if needed
    User: {
        posts: async (parentUser) => {
            // Assuming parentUser.uuid contains the user's UUID (already correctly formatted)
            // If your parentUser.uuid is a Buffer, convert it to string first.
            const userUuidString = Buffer.isBuffer(parentUser.uuid)
                ? UUIDScalar.serialize(parentUser.uuid) // Use your scalar's serialize method
                : parentUser.uuid;

            const posts = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str, BIN_TO_UUID(createdBy) as createdBy_str FROM posts WHERE createdBy = UUID_TO_BIN(?)', [userUuidString]);
            return posts.map(p => ({ ...p, uuid: p.uuid_str, createdBy: p.createdBy_str })); // Ensure UUIDs are strings
        },
    },
    Post: {
        createdBy: async (parentPost) => {
            // Assuming parentPost.createdBy contains the creator's UUID (already correctly formatted)
            // If your parentPost.createdBy is a Buffer, convert it to string first.
            const createdByUuidString = Buffer.isBuffer(parentPost.createdBy)
                ? UUIDScalar.serialize(parentPost.createdBy) // Use your scalar's serialize method
                : parentPost.createdBy;

            const users = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str FROM users WHERE uuid = UUID_TO_BIN(?)', [createdByUuidString]);
            if (users.length > 0) {
                return { ...users[0], uuid: users[0].uuid_str }; // Ensure UUID is a string
            }
            return null;
        },
        // Ensure createdAt and updatedAt are strings if they are Date objects
        createdAt: (parentPost) => parentPost.createdAt instanceof Date ? parentPost.createdAt.toISOString() : parentPost.createdAt,
        updatedAt: (parentPost) => parentPost.updatedAt instanceof Date ? parentPost.updatedAt.toISOString() : parentPost.updatedAt,
    },
};

module.exports = resolvers;