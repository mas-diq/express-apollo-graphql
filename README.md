# Project Title: [Express-Apollo-Graphql] - GraphQL API with Prisma

A robust GraphQL API built with Express.js, Apollo Server, JWT for authentication, Prisma ORM, and MariaDB as the database. This API provides CRUD operations for users and posts.

---

## Table of Contents
- [Project Title: \[Express-Apollo-Graphql\] - GraphQL API with Prisma](#project-title-express-apollo-graphql---graphql-api-with-prisma)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack 🛠️](#tech-stack-️)
  - [Prerequisites 📋](#prerequisites-)
  - [Getting Started 🚀](#getting-started-)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
    - [Database Setup with Prisma](#database-setup-with-prisma)
  - [Running the Server 🏃‍♂️](#running-the-server-️)
- [or](#or)
---

## Tech Stack 🛠️

* **Backend Framework:** Express.js
* **GraphQL Server:** Apollo Server
* **ORM:** Prisma
* **Database:** MariaDB
* **Authentication:** JSON Web Tokens (JWT)
* **Environment Variables:** `dotenv`
* **UUID Generation:** Prisma (`@default(uuid())`)
* **Password Hashing:** `bcryptjs`

---

## Prerequisites 📋

* [Node.js](https://nodejs.org/) (LTS version recommended)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* [MariaDB](https://mariadb.org/download/) Server installed and running.
* (Optional) A MariaDB client (e.g., DBeaver, HeidiSQL) for direct database inspection.

---

## Getting Started 🚀

### Installation

1.  **Clone the repository:**
    ```bash
    git clone http://github.com/mas-diq/express-apollo-graphql
    cd express-apollo-graphql
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Environment Variables

1.  Prisma CLI might have already created/updated your `.env` when you ran `npx prisma init`. If not, or to customize, copy the example:
    ```bash
    cp .env.example .env
    ```

2.  Open the `.env` file and ensure your `DATABASE_URL` is correctly set for your MariaDB instance, along with other variables:
    ```env
    # Server Configuration
    PORT=4000
    NODE_ENV=development

    # JWT Configuration
    JWT_SECRET=your_very_strong_and_long_random_secret_key
    JWT_EXPIRES_IN=1h

    # MariaDB Database Configuration for Prisma
    DATABASE_URL="mysql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME"
    # Example: DATABASE_URL="mysql://myuser:mypassword@localhost:3306/mydb"
    ```
    **Important:** Create the database (`your_database_name`) in MariaDB manually if it doesn't exist yet. Prisma `migrate dev` will create the tables within this database but not the database itself.

### Database Setup with Prisma

Prisma handles database schema migrations.

1.  **Create your database in MariaDB:**
    Before running migrations, ensure the database specified in `DATABASE_URL` exists. You can create it using a MariaDB client:
    ```sql
    CREATE DATABASE your_database_name;
    ```

2.  **Run Prisma Migrate:**
    This command will create the database tables based on your `prisma/schema.prisma` file and generate the Prisma Client.
    ```bash
    npx prisma migrate dev --name init
    ```
    *(The `--name init` flag is for the first migration; subsequent migrations can have descriptive names.)*
    This will:
    * Create a `migrations` folder in your `prisma` directory.
    * Apply the schema to your database.
    * Generate/update Prisma Client (`@prisma/client`) in `node_modules/.prisma/client`.

3.  **(Optional) Generate Prisma Client manually:**
    If you only change the schema and don't want to run a migration (e.g., just adding a comment or reformatting), or if client generation failed, you can run:
    ```bash
    npx prisma generate
    ```

---
## Running the Server 🏃‍♂️
```bash
npm run dev
# or
npm start