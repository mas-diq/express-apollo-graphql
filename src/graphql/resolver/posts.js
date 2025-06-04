const { GraphQLError } = require('graphql');
const prisma = require('../../config/prisma');
const { protectResolver } = require('../../services/auth');

const postsResolvers = {
    Query: {
        getAllPosts: async (_, { skip, take, orderBy }) => {
            const queryOptions = {
                // include: { author: true }, // Include author details
                orderBy: orderBy ? { [orderBy.split('_')[0]]: orderBy.split('_')[1].toLowerCase() } : { createdAt: 'desc' }, // e.g. "createdAt_DESC"
            };
            if (skip !== undefined) queryOptions.skip = skip;
            if (take !== undefined) queryOptions.take = take;

            return prisma.post.findMany(queryOptions);
        },
        getPost: async (_, { uuid }) => {
            const post = await prisma.post.findUnique({
                where: { uuid },
                // include: { author: true },
            });
            if (!post) {
                throw new GraphQLError('Post not found', { extensions: { code: 'NOT_FOUND' } });
            }
            return post;
        },
        getPostsByUser: async (_, { authorId }) => {
            return prisma.post.findMany({
                where: { authorId },
                // include: { author: true },
                orderBy: { createdAt: 'desc' },
            });
        },
        getPostsByStatus: async (_, { status }) => {
            return prisma.post.findMany({
                where: { status }, // Prisma handles enums directly
                // include: { author: true },
                orderBy: { createdAt: 'desc' },
            });
        },
    },
    Mutation: {
        createPost: protectResolver(async (_, { input }, context) => {
            const { title, subtitle, image, content, status } = input;
            const authorId = context.user.id;

            try {
                const post = await prisma.post.create({
                    data: {
                        // uuid auto-generated
                        title,
                        subtitle,
                        image,
                        content,
                        status: status || 'DRAFT', // Ensure enum value is correct
                        author: {
                            connect: { uuid: authorId }, // Connect to existing user
                        },
                    },
                    // include: { author: true } // Optionally include author in response
                });
                return post;
            } catch (err) {
                console.error("Create post error:", err);
                // Check for specific Prisma errors if needed, e.g., foreign key constraint
                throw new GraphQLError('Could not create post.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        updatePost: protectResolver(async (_, { uuid, input }, context) => {
            const userId = context.user.id;

            const postToUpdate = await prisma.post.findUnique({ where: { uuid } });
            if (!postToUpdate) {
                throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
            }
            if (postToUpdate.authorId !== userId /* && context.user.role !== 'ADMIN' */) {
                throw new GraphQLError('Not authorized to update this post.', { extensions: { code: 'FORBIDDEN' } });
            }

            const dataToUpdate = { ...input }; // Spread input directly
            if (Object.keys(dataToUpdate).length === 0) {
                throw new GraphQLError('No update information provided.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            // Remove undefined fields, Prisma handles this or you can filter them.
            for (const key in dataToUpdate) {
                if (dataToUpdate[key] === undefined) {
                    delete dataToUpdate[key];
                }
            }


            try {
                const updatedPost = await prisma.post.update({
                    where: { uuid },
                    data: dataToUpdate,
                    // include: { author: true }
                });
                return updatedPost;
            } catch (err) {
                if (err.code === 'P2025') { // Record to update not found
                    throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
                }
                console.error("Update post error:", err);
                throw new GraphQLError('Could not update post.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        deletePost: protectResolver(async (_, { uuid }, context) => {
            const userId = context.user.id;

            const postToDelete = await prisma.post.findUnique({ where: { uuid } });
            if (!postToDelete) {
                throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
            }
            if (postToDelete.authorId !== userId /* && context.user.role !== 'ADMIN' */) {
                throw new GraphQLError('Not authorized to delete this post.', { extensions: { code: 'FORBIDDEN' } });
            }

            try {
                await prisma.post.delete({ where: { uuid } });
                return `Post with UUID ${uuid} successfully deleted.`;
            } catch (err) {
                if (err.code === 'P2025') { // Record to delete not found
                    throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
                }
                console.error("Delete post error:", err);
                throw new GraphQLError('Could not delete post.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
    },
};

module.exports = postsResolvers;