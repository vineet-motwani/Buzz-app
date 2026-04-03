export const types = `#graphql
        
    input CreateBuzzData {
        content: String!
        imageURL: String
    }

    type Buzz {
        id: ID!
        content: String!
        imageURL: String
        
        author: User!
        hasLiked: Boolean
        hasBookmarked: Boolean
    }
`;
