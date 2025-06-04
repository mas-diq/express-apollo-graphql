const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar UUID # Custom scalar for UUID (optional with Prisma, but good for clarity)

  type User {
    uuid: UUID!
    name: String!
    email: String!
    posts: [Post!]
    createdAt: String!
    updatedAt: String!
  }

  type Post {
    uuid: UUID!
    title: String!
    subtitle: String
    image: String
    content: String!
    status: PostStatus!
    author: User! # Changed from createdBy for clarity, relates to authorId
    authorId: UUID! # Expose authorId
    createdAt: String!
    updatedAt: String!
  }

  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
  }

  input UpdateUserInput {
    name: String
    email: String
  }

  input CreatePostInput {
    title: String!
    subtitle: String
    image: String
    content: String!
    status: PostStatus = DRAFT
  }

  input UpdatePostInput {
    title: String
    subtitle: String
    image: String
    content: String
    status: PostStatus
  }

  type Query {
    getAllUsers: [User!]
    getUser(uuid: UUID!): User
    getAllPosts(skip: Int, take: Int, orderBy: String): [Post!] # Added pagination/ordering example
    getPost(uuid: UUID!): Post
    getPostsByUser(authorId: UUID!): [Post!]
    getPostsByStatus(status: PostStatus!): [Post!]
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Mutation {
    registerUser(input: CreateUserInput!): AuthPayload!
    loginUser(email: String!, password: String!): AuthPayload!
    updateUser(uuid: UUID!, input: UpdateUserInput!): User # Protected
    deleteUser(uuid: UUID!): String # Protected

    createPost(input: CreatePostInput!): Post # Protected
    updatePost(uuid: UUID!, input: UpdatePostInput!): Post # Protected
    deletePost(uuid: UUID!): String # Protected
  }
`;

module.exports = typeDefs;