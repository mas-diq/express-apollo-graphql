const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar UUID # Custom scalar for UUID

  type User {
    uuid: UUID!
    name: String!
    email: String!
    posts: [Post!] # Posts created by this user
  }

  type Post {
    uuid: UUID!
    title: String!
    subtitle: String
    image: String
    content: String!
    status: PostStatus!
    createdBy: User! # The user who created the post
    createdAt: String! # Typically ISO 8601 date string
    updatedAt: String!
  }

  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  # INPUT TYPES
  input CreateUserInput {
    name: String!
    email: String!
    password: String! # Min length 8 for example
  }

  input UpdateUserInput {
    name: String
    email: String
    # password changes should likely be a separate mutation
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

  # QUERIES
  type Query {
    # User Queries
    getAllUsers: [User!]
    getUser(uuid: UUID!): User

    # Post Queries
    getAllPosts: [Post!]
    getPost(uuid: UUID!): Post
    getPostsByUser(userUuid: UUID!): [Post!]
    getPostsByStatus(status: PostStatus!): [Post!]
  }

  # MUTATIONS
  type AuthPayload {
    token: String!
    user: User!
  }

  type Mutation {
    # User Mutations
    registerUser(input: CreateUserInput!): AuthPayload! # Returns token and user
    loginUser(email: String!, password: String!): AuthPayload!
    updateUser(uuid: UUID!, input: UpdateUserInput!): User # Protected
    deleteUser(uuid: UUID!): String # Protected, returns a confirmation message

    # Post Mutations
    createPost(input: CreatePostInput!): Post # Protected
    updatePost(uuid: UUID!, input: UpdatePostInput!): Post # Protected
    deletePost(uuid: UUID!): String # Protected, returns a confirmation message
  }
`;

module.exports = typeDefs;