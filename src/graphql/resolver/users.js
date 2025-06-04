const bcrypt = require('bcryptjs'); // For password hashing
const { v4: uuidv4 } = require('uuid');
const { GraphQLError } = require('graphql');
const db = require('../../config/database');
const { generateToken, protectResolver } = require('../../services/auth');

// Helper function to convert UUID string to Buffer for MariaDB BINARY(16)
function uuidToBin(uuidString) {
    return Buffer.from(uuidString.replace(/-/g, ''), 'hex');
}

// Helper to map DB result to GraphQL User type (handles BINARY(16) UUID)
const mapDbUserToGqlUser = (dbUser) => {
    if (!dbUser) return null;
    return {
        ...dbUser,
        uuid: dbUser.uuid_str || (dbUser.uuid instanceof Buffer ? dbUser.uuid.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : dbUser.uuid),
    };
};


const usersResolvers = {
    Query: {
        getAllUsers: protectResolver(async (_, __, context) => {
            // Example of admin-only access
            // if (context.user.role !== 'ADMIN') {
            //   throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            // }
            const users = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str FROM users');
            return users.map(mapDbUserToGqlUser);
        }),
        getUser: protectResolver(async (_, { uuid }, context) => {
            const users = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str FROM users WHERE uuid = UUID_TO_BIN(?)', [uuid]);
            if (users.length === 0) {
                throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
            }
            // Optional: Check if the requesting user is asking for their own profile or is an admin
            // if (context.user.id !== uuid && context.user.role !== 'ADMIN') {
            //   throw new GraphQLError('Not authorized to view this user', { extensions: { code: 'FORBIDDEN' } });
            // }
            return mapDbUserToGqlUser(users[0]);
        }),
    },
    Mutation: {
        registerUser: async (_, { input }) => {
            const { name, email, password } = input;

            // Check if user already exists
            const existingUsers = await db.query('SELECT email FROM users WHERE email = ?', [email]);
            if (existingUsers.length > 0) {
                throw new GraphQLError('User with this email already exists', {
                    extensions: { code: 'BAD_USER_INPUT', argumentName: 'email' },
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);
            const newUuid = uuidv4();

            try {
                await db.query('INSERT INTO users (uuid, name, email, password) VALUES (UUID_TO_BIN(?), ?, ?, ?)', [
                    newUuid,
                    name,
                    email,
                    hashedPassword,
                ]);

                const user = { uuid: newUuid, name, email }; // Construct user object for token and response
                const token = generateToken(user);
                return { token, user };
            } catch (err) {
                console.error("Registration error:", err);
                throw new GraphQLError('Could not register user.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },
        loginUser: async (_, { email, password }) => {
            const users = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                throw new GraphQLError('Invalid email or password.', { extensions: { code: 'UNAUTHENTICATED' } });
            }

            const user = mapDbUserToGqlUser(users[0]);
            const isValidPassword = await bcrypt.compare(password, user.password); // user.password is the hashed one from DB

            if (!isValidPassword) {
                throw new GraphQLError('Invalid email or password.', { extensions: { code: 'UNAUTHENTICATED' } });
            }

            const token = generateToken({ uuid: user.uuid, email: user.email });
            return { token, user: { uuid: user.uuid, name: user.name, email: user.email } };
        },
        updateUser: protectResolver(async (_, { uuid, input }, context) => {
            // Ensure user can only update their own profile unless they are an admin
            if (context.user.id !== uuid /* && context.user.role !== 'ADMIN' */) {
                throw new GraphQLError('Not authorized to update this user.', { extensions: { code: 'FORBIDDEN' } });
            }

            const { name, email } = input;
            const fieldsToUpdate = {};
            if (name) fieldsToUpdate.name = name;
            if (email) {
                // Check if new email is already taken by another user
                const existingUsers = await db.query('SELECT uuid FROM users WHERE email = ? AND uuid != UUID_TO_BIN(?)', [email, uuid]);
                if (existingUsers.length > 0) {
                    throw new GraphQLError('Email already in use by another account.', {
                        extensions: { code: 'BAD_USER_INPUT', argumentName: 'email' },
                    });
                }
                fieldsToUpdate.email = email;
            }


            if (Object.keys(fieldsToUpdate).length === 0) {
                throw new GraphQLError('No update information provided.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(fieldsToUpdate), uuid];

            try {
                const result = await db.query(`UPDATE users SET ${setClauses} WHERE uuid = UUID_TO_BIN(?)`, values);
                if (result.affectedRows === 0) {
                    throw new GraphQLError('User not found or no changes made.', { extensions: { code: 'NOT_FOUND' } });
                }
                const updatedUsers = await db.query('SELECT *, BIN_TO_UUID(uuid) as uuid_str FROM users WHERE uuid = UUID_TO_BIN(?)', [uuid]);
                return mapDbUserToGqlUser(updatedUsers[0]);
            } catch (err) {
                console.error("Update user error:", err);
                throw new GraphQLError('Could not update user.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        deleteUser: protectResolver(async (_, { uuid }, context) => {
            // Ensure user can only delete their own profile unless they are an admin
            if (context.user.id !== uuid /* && context.user.role !== 'ADMIN' */) {
                throw new GraphQLError('Not authorized to delete this user.', { extensions: { code: 'FORBIDDEN' } });
            }
            // Consider what happens to posts by this user (CASCADE on FOREIGN KEY handles it in DB)
            const result = await db.query('DELETE FROM users WHERE uuid = UUID_TO_BIN(?)', [uuid]);
            if (result.affectedRows === 0) {
                throw new GraphQLError('User not found.', { extensions: { code: 'NOT_FOUND' } });
            }
            return `User with UUID ${uuid} successfully deleted.`;
        }),
    },
};

module.exports = usersResolvers;