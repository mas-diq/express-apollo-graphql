const jwt = require('jsonwebtoken');
const { GraphQLError } = require('graphql'); // For throwing GraphQL-friendly errors

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
}

const generateToken = (user) => {
    // user should be an object like { uuid: user.uuid, email: user.email }
    return jwt.sign({ userId: user.uuid, email: user.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

const verifyToken = (token) => {
    try {
        if (!token) {
            return null;
        }
        // Remove "Bearer " prefix if present
        const actualToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
        return jwt.verify(actualToken, JWT_SECRET);
    } catch (error) {
        return null; // Or throw a specific error if needed
    }
};

// Middleware for Apollo context or a helper for resolvers
const getUserFromToken = (req) => {
    const authorizationHeader = req.headers.authorization || '';
    if (authorizationHeader) {
        const token = authorizationHeader.split(' ')[1]; // Bearer <token>
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                return decoded; // This will contain { userId, email, iat, exp }
            } catch (e) {
                throw new GraphQLError('Invalid or expired token.', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
        }
    }
    return null;
};

const protectResolver = (resolver) => {
    return (parent, args, context, info) => {
        if (!context.user) {
            throw new GraphQLError('You must be logged in to do that.', {
                extensions: { code: 'UNAUTHENTICATED' },
            });
        }
        return resolver(parent, args, context, info);
    };
};


module.exports = {
    generateToken,
    verifyToken,
    getUserFromToken,
    protectResolver
};