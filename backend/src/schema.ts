//used to determine graphql schema 
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Post {
    id: ID!
    title: String!
    content: String!
    author: String!
    createdAt: String!
    updatedAt: String!
    published: Boolean!
    tags: [String!]!
  }

  type Query {
    posts: [Post!]!
    post(id: ID!): Post
    postsByAuthor(author: String!): [Post!]!
    publishedPosts: [Post!]!
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post
    deletePost(id: ID!): Boolean!
    publishPost(id: ID!): Post
    unpublishPost(id: ID!): Post
  }

  input CreatePostInput {
    title: String!
    content: String!
    author: String!
    tags: [String!] = []
    published: Boolean = false
  }

  input UpdatePostInput {
    title: String
    content: String
    author: String
    tags: [String!]
    published: Boolean
  }

  type Subscription {
    postAdded: Post!
    postUpdated: Post!
    postDeleted: ID!
  }
`;