const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateContext = ({ req }) => {
    const authHeader = req.headers.authorization || '';
    const context = {};

    if (authHeader) {
        const token = authHeader.split('Bearer ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                context.user = { id: decoded.userId, email: decoded.email }; // Attach user to context
            } catch (err) {
                // Don't throw an error here, let resolvers decide if auth is required
                // console.warn('Invalid or expired token:', err.message);
                context.user = null;
            }
        }
    } else {
        context.user = null;
    }
    return context;
};

module.exports = { authenticateContext };