// src/graphql/resolvers/index.js
const { GraphQLScalarType, Kind } = require('graphql');
const { validate: uuidValidate, version: uuidVersion } = require('uuid');
const usersResolvers = require('./users');
const postsResolvers = require('./posts');
const prisma = require('../../config/prisma'); // Import Prisma client

// Custom UUID Scalar (simplified as Prisma handles string UUIDs well)
const UUIDScalar = new GraphQLScalarType({
    name: 'UUID',
    description: 'UUID custom scalar type. Accepts and returns UUID strings.',
    serialize(value) { // value from the resolver
        if (typeof value === 'string' && uuidValidate(value)) {
            return value;
        }
        throw new Error('GraphQL UUID Scalar serializer expected a valid UUID string.');
    },
    parseValue(value) { // value from the client (JSON)
        if (typeof value === 'string' && uuidValidate(value)) {
            return value;
        }
        throw new Error('GraphQL UUID Scalar parser expected a valid UUID string.');
    },
    parseLiteral(ast) { // value from the client (query AST)
        if (ast.kind === Kind.STRING && uuidValidate(ast.value)) {
            return ast.value;
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

    // Field-level resolvers for relationships (Prisma often handles these automatically)
    User: {
        posts: (parentUser, _args, _context) => {
            return prisma.user.findUnique({ where: { uuid: parentUser.uuid } }).posts();
            // Or, if posts are already included via Prisma's `include`:
            // return parentUser.posts;
        },
    },
    Post: {
        author: (parentPost, _args, _context) => {
            return prisma.post.findUnique({ where: { uuid: parentPost.uuid } }).author();
            // Or, if author is already included:
            // return parentPost.author;
        },
        // Ensure DateTimes from Prisma are ISO strings for GraphQL
        createdAt: (parent) => parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt,
        updatedAt: (parent) => parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt,
    },
};

module.exports = resolvers;