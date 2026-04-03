import { graphql } from "../../gql";

export const verifyUserGoogleTokenQuery = graphql(`
  query VerifyUserGoogleToken($token: String!) {
    verifyGoogleToken(token: $token)
  }
`);

export const getCurrentUserQuery = graphql(`
  query GetCurrentUser {
    getCurrentUser {
      id
      profileImageURL
      email
      firstName
      lastName
      recommendedUsers {
        id
        firstName
        lastName
        profileImageURL
      }
      followers {
        id
        firstName
        lastName
        profileImageURL
      }
      following {
        id
        firstName
        lastName
        profileImageURL
      }
      buzzs {
        id
        content
        imageURL
        author {
          id
          firstName
          lastName
          profileImageURL
        }
        hasLiked
        hasBookmarked
      }
      notifications {
        id
        content
        createdAt
      }
      bookmarks {
        id
        createdAt
        buzz {
          id
          content
          imageURL
          author {
            id
            firstName
            lastName
            profileImageURL
          }
          hasLiked
          hasBookmarked
        }
      }
    }
  }
`);

export const getUserByIdQuery = graphql(`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      id
      firstName
      lastName
      profileImageURL
      followers {
        id
        firstName
        lastName
        profileImageURL
      }
      following {
        id
        firstName
        lastName
        profileImageURL
      }
      buzzs {
        content
        id
        imageURL
        author {
          id
          firstName
          lastName
          profileImageURL
        }
        hasLiked
        hasBookmarked
      }
    }
  }
`);

export const getUserByNameQuery = graphql(`
  query GetUserByName($name: String!) {
    getUserByName(name: $name) {
      id
      firstName
      lastName
      profileImageURL
      followers {
        id
        firstName
        lastName
        profileImageURL
      }
      following {
        id
        firstName
        lastName
        profileImageURL
      }
      buzzs {
        content
        id
        imageURL
        author {
          id
          firstName
          lastName
          profileImageURL
        }
        hasLiked
        hasBookmarked
      }
    }
  }
`);
