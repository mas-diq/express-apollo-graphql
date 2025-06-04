const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5, // Adjust as needed
    // Recommended for UUIDs if you store them as BINARY(16)
    // typeCast: function (field, next) {
    //   if (field.type === 'BLOB' && field.length === 16) {
    //     const buffer = field.buffer();
    //     if (buffer) {
    //       // Convert BINARY(16) to UUID string
    //       return buffer.toString('hex', 0, 4) + '-' +
    //              buffer.toString('hex', 4, 6) + '-' +
    //              buffer.toString('hex', 6, 8) + '-' +
    //              buffer.toString('hex', 8, 10) + '-' +
    //              buffer.toString('hex', 10, 16);
    //     }
    //   }
    //   return next();
    // }
});

async function getConnection() {
    let conn;
    try {
        conn = await pool.getConnection();
        return conn;
    } catch (err) {
        console.error("Error connecting to MariaDB:", err);
        throw err;
    }
}

// Function to execute queries
async function query(sql, params) {
    let conn;
    try {
        conn = await getConnection();
        const results = await conn.query(sql, params);
        return results;
    } catch (err) {
        console.error("Error executing query:", err);
        throw err;
    } finally {
        if (conn) conn.release(); // or conn.end() if not using a pool for a single connection
    }
}

module.exports = {
    pool, // Export the pool if you need to manage transactions manually
    getConnection,
    query // Export a utility function for queries
};