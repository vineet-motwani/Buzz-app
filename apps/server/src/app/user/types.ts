export const types = `#graphql
    type Notification {
        id: ID!
        content: String!
        createdAt: String!
    }

    type Bookmark {
        id: ID!
        buzz: Buzz!
        createdAt: String!
    }

    input UpdateUserProfileData {
        firstName: String
        lastName: String
        profileImageURL: String
    }

    type User {
        id: ID!
        firstName: String!
        lastName: String
        username: String
        email: String!
        profileImageURL: String

        followers: [User]
        following: [User]

        recommendedUsers: [User]

        buzzs: [Buzz]
        notifications: [Notification]
        bookmarks: [Bookmark]
    }
`;
