export const mutations = `#graphql
    followUser(to: ID!): Boolean
    unfollowUser(to: ID!): Boolean
    updateUserProfile(payload: UpdateUserProfileData!): User
    logout: Boolean
`;
