export const mutations = `#graphql
    createBuzz(payload: CreateBuzzData!): Buzz
    likeBuzz(buzzId: String!): Boolean
    bookmarkBuzz(buzzId: String!): Boolean
`;