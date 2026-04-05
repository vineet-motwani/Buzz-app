export const queries = `#graphql
    verifyGoogleToken(token: String!): String
    getCurrentUser: User

    getUserById(id: ID!): User
    getUserByUsername(username: String!): User
    getSignedURLForProfileImage(imageName: String!, imageType: String!): String
`;
