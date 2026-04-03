export const queries = `#graphql
    verifyGoogleToken(token: String!): String
    getCurrentUser: User

    getUserById(id: ID!): User
    getUserByName(name: String!): User
`;
