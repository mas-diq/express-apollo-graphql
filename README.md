# Project Title: [Your Project Name] - GraphQL API

A robust GraphQL API built with Express.js, Apollo Server, JWT for authentication, and MariaDB as the database. This API provides CRUD (Create, Read, Update, Delete) operations for users and posts.

---

## Table of Contents

- [Project Title: \[Your Project Name\] - GraphQL API](#project-title-your-project-name---graphql-api)
  - [Table of Contents](#table-of-contents)
  - [Features ✨](#features-)
  - [Tech Stack 🛠️](#tech-stack-️)
  - [Prerequisites 📋](#prerequisites-)
  - [Getting Started 🚀](#getting-started-)
    - [Installation](#installation)
    - [Database Setup](#database-setup)
    - [Environment Variables](#environment-variables)
  - [Running the Server 🏃‍♂️](#running-the-server-️)
    - [Development Mode](#development-mode)

---

## Features ✨

* **User Management:**
    * User registration (name, email, password) with JWT token generation.
    * User login with JWT token generation.
    * Get user details (protected).
    * Update user details (protected).
    * Delete user (protected).
* **Post Management:**
    * Create new posts (title, subtitle, image URL, content, status) linked to the creator (protected).
    * Get all posts.
    * Get a single post by its UUID.
    * Get all posts by a specific user.
    * Get posts by status (DRAFT, PUBLISHED, ARCHIVED).
    * Update existing posts (protected, owner only).
    * Delete posts (protected, owner only).
* **Authentication:** Secure JWT (JSON Web Token) based authentication for protected operations.
* **Database:** MariaDB for persistent data storage.
* **GraphQL:** Efficient and flexible data querying with Apollo Server.
* **UUIDs:** Uses UUIDs for unique identifiers for users and posts.

---

## Tech Stack 🛠️

* **Backend Framework:** Express.js
* **GraphQL Server:** Apollo Server
* **Database:** MariaDB
* **Authentication:** JSON Web Tokens (JWT)
* **ORM/Driver:** `mariadb` (Node.js driver) or Sequelize/Knex (if you choose to implement one)
* **Environment Variables:** `dotenv`
* **UUID Generation:** `uuid`
* **Password Hashing:** `bcryptjs`

---

## Prerequisites 📋

* [Node.js](https://nodejs.org/) (LTS version recommended, e.g., v18.x or v20.x)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* [MariaDB](https://mariadb.org/download/) Server installed and running.
* A MariaDB client (e.g., `mysql` CLI, DBeaver, HeidiSQL) to create the database and tables.

---

## Getting Started 🚀

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd your-project-name
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

### Database Setup

1.  **Connect to your MariaDB server:**
    Use your preferred MariaDB client.

2.  **Create the database:**
    ```sql
    CREATE DATABASE your_database_name;
    ```

3.  **Create the necessary tables:**
    Execute the SQL scripts found in the project (or adapt the example below) to create the `users` and `posts` tables. Make sure to define the columns as specified (uuid, name, email for users; uuid, title, subtitle, image, content, status, createdBy for posts).

    **Example SQL (refer to `src/config/database.js` or provided SQL for actual schema):**
    ```sql
    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
        uuid BINARY(16) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- Posts Table
    CREATE TABLE IF NOT EXISTS posts (
        uuid BINARY(16) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        image VARCHAR(255),
        content TEXT NOT NULL,
        status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
        createdBy BINARY(16) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(uuid) ON DELETE CASCADE
    );

    -- Optional: MariaDB helper functions for UUIDs if storing as BINARY(16)
    -- DELIMITER //
    -- CREATE FUNCTION UUID_TO_BIN(uuid_str CHAR(36))
    -- RETURNS BINARY(16)
    -- DETERMINISTIC
    -- BEGIN
    --   RETURN UNHEX(REPLACE(uuid_str, '-', ''));
    -- END //
    -- DELIMITER ;

    -- DELIMITER //
    -- CREATE FUNCTION BIN_TO_UUID(bin BINARY(16))
    -- RETURNS CHAR(36)
    -- DETERMINISTIC
    -- BEGIN
    --   DECLARE hex_str CHAR(32);
    --   SET hex_str = HEX(bin);
    --   RETURN LOWER(CONCAT(
    --     SUBSTRING(hex_str, 1, 8), '-',
    --     SUBSTRING(hex_str, 9, 4), '-',
    --     SUBSTRING(hex_str, 13, 4), '-',
    --     SUBSTRING(hex_str, 17, 4), '-',
    --     SUBSTRING(hex_str, 21, 12)
    --   ));
    -- END //
    -- DELIMITER ;
    ```

### Environment Variables

1.  Create a `.env` file in the root of the project by copying the example:
    ```bash
    cp .env.example .env
    ```

2.  Open the `.env` file and fill in your specific configuration details:
    ```env
    # Server Configuration
    PORT=4000
    NODE_ENV=development

    # JWT Configuration
    JWT_SECRET=your_very_strong_and_long_random_secret_key # IMPORTANT: Change this!
    JWT_EXPIRES_IN=1h # e.g., 1h, 7d, 30m

    # MariaDB Database Configuration
    DB_HOST=localhost
    DB_PORT=3306 # Or your MariaDB port
    DB_USER=your_mariadb_username
    DB_PASSWORD=your_mariadb_password
    DB_NAME=your_database_name
    ```
    **Security Note:** `JWT_SECRET` should be a long, random, and strong string. Do not use a weak secret.

---

## Running the Server 🏃‍♂️

### Development Mode

This mode uses `nodemon` for automatic server restarts when files change.

```bash
npm run dev