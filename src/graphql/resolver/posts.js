const { v4: uuidv4 } = require('uuid');
const { GraphQLError } = require('graphql');
const db = require('../../config/database');
const { protectResolver } = require('../../service/auth');

// Helper function to convert UUID string to Buffer for MariaDB BINARY(16)
function uuidToBin(uuidString) {
    return Buffer.from(uuidString.replace(/-/g, ''), 'hex');
}

// Helper to map DB result to GraphQL Post type (handles BINARY(16) UUIDs)
const mapDbPostToGqlPost = (dbPost) => {
    if (!dbPost) return null;
    return {
        ...dbPost,
        uuid: dbPost.uuid_str || (dbPost.uuid instanceof Buffer ? dbPost.uuid.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : dbPost.uuid),
        createdBy: dbPost.createdBy_str || (dbPost.createdBy instanceof Buffer ? dbPost.createdBy.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : dbPost.createdBy),
        createdAt: dbPost.createdAt instanceof Date ? dbPost.createdAt.toISOString() : dbPost.createdAt,
        updatedAt: dbPost.updatedAt instanceof Date ? dbPost.updatedAt.toISOString() : dbPost.updatedAt,
    };
};


const postsResolvers = {
    Query: {
        getAllPosts: async () => {
            const posts = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str, BIN_TO_UUID(createdBy) as createdBy_str FROM posts ORDER BY createdAt DESC');
            return posts.map(mapDbPostToGqlPost);
        },
        getPost: async (_, { uuid }) => {
            const posts = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str, BIN_TO_UUID(createdBy) as createdBy_str FROM posts WHERE uuid = UUID_TO_BIN(?)', [uuid]);
            if (posts.length === 0) {
                throw new GraphQLError('Post not found', { extensions: { code: 'NOT_FOUND' } });
            }
            return mapDbPostToGqlPost(posts[0]);
        },
        getPostsByUser: async (_, { userUuid }) => {
            const posts = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str, BIN_TO_UUID(createdBy) as createdBy_str FROM posts WHERE createdBy = UUID_TO_BIN(?) ORDER BY createdAt DESC', [userUuid]);
            return posts.map(mapDbPostToGqlPost);
        },
        getPostsByStatus: async (_, { status }) => {
            const posts = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str, BIN_TO_UUID(createdBy) as createdBy_str FROM posts WHERE status = ? ORDER BY createdAt DESC', [status]);
            return posts.map(mapDbPostToGqlPost);
        },
    },
    Mutation: {
        createPost: protectResolver(async (_, { input }, context) => {
            const { title, subtitle, image, content, status } = input;
            const newUuid = uuidv4();
            const userId = context.user.id; //  Get user ID from context (populated by JWT middleware)

            try {
                await db.query(
                    'INSERT INTO posts (uuid, title, subtitle, image, content, status, createdBy) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, UUID_TO_BIN(?))',
                    [newUuid, title, subtitle, image, content, status || 'DRAFT', userId]
                );
                const createdPosts = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str, BIN_TO_UUID(createdBy) as createdBy_str FROM posts WHERE uuid = UUID_TO_BIN(?)', [newUuid]);
                return mapDbPostToGqlPost(createdPosts[0]);
            } catch (err) {
                console.error("Create post error:", err);
                throw new GraphQLError('Could not create post.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        updatePost: protectResolver(async (_, { uuid, input }, context) => {
            const userId = context.user.id;

            // Fetch the post to check ownership
            const existingPosts = await db.query('SELECT *, BIN_TO_UUID(createdBy) as createdBy_str FROM posts WHERE uuid = UUID_TO_BIN(?)', [uuid]);
            if (existingPosts.length === 0) {
                throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
            }
            const postToUpdate = mapDbPostToGqlPost(existingPosts[0]);


            if (postToUpdate.createdBy !== userId /* && context.user.role !== 'ADMIN' */) {
                throw new GraphQLError('Not authorized to update this post.', { extensions: { code: 'FORBIDDEN' } });
            }

            const { title, subtitle, image, content, status } = input;
            const fieldsToUpdate = {};
            if (title !== undefined) fieldsToUpdate.title = title;
            if (subtitle !== undefined) fieldsToUpdate.subtitle = subtitle;
            if (image !== undefined) fieldsToUpdate.image = image;
            if (content !== undefined) fieldsToUpdate.content = content;
            if (status !== undefined) fieldsToUpdate.status = status;


            if (Object.keys(fieldsToUpdate).length === 0) {
                throw new GraphQLError('No update information provided.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(fieldsToUpdate), uuid];

            try {
                const result = await db.query(`UPDATE posts SET ${setClauses} WHERE uuid = UUID_TO_BIN(?)`, values);
                if (result.affectedRows === 0) {
                    // This case might be redundant if the initial fetch already confirmed existence.
                    throw new GraphQLError('Post not found or no changes made.', { extensions: { code: 'NOT_FOUND' } });
                }
                const updatedPosts = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str, BIN_TO_UUID(createdBy) as createdBy_str FROM posts WHERE uuid = UUID_TO_BIN(?)', [uuid]);
                return mapDbPostToGqlPost(updatedPosts[0]);
            } catch (err) {
                console.error("Update post error:", err);
                throw new GraphQLError('Could not update post.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        deletePost: protectResolver(async (_, { uuid }, context) => {
            const userId = context.user.id;

            const existingPosts = await db.query('SELECT createdBy, BIN_TO_UUID(createdBy) as createdBy_str FROM posts WHERE uuid = UUID_TO_BIN(?)', [uuid]);
            if (existingPosts.length === 0) {
                throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
            }
            const postToDelete = mapDbPostToGqlPost(existingPosts[0]);


            if (postToDelete.createdBy !== userId /* && context.user.role !== 'ADMIN' */) {
                throw new GraphQLError('Not authorized to delete this post.', { extensions: { code: 'FORBIDDEN' } });
            }

            const result = await db.query('DELETE FROM posts WHERE uuid = UUID_TO_BIN(?)', [uuid]);
            if (result.affectedRows === 0) {
                throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
            }
            return `Post with UUID ${uuid} successfully deleted.`;
        }),
    },
};

module.exports = postsResolvers;