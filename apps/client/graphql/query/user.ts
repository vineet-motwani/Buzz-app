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
      username
      recommendedUsers {
        id
        firstName
        lastName
        username
        profileImageURL
      }
      followers {
        id
        firstName
        lastName
        username
        profileImageURL
      }
      following {
        id
        firstName
        lastName
        username
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
          username
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
            username
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
      username
      profileImageURL
      followers {
        id
        firstName
        lastName
        username
        profileImageURL
      }
      following {
        id
        firstName
        lastName
        username
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
          username
          profileImageURL
        }
        hasLiked
        hasBookmarked
      }
    }
  }
`);

export const getUserByUsernameQuery = graphql(`
  query GetUserByUsername($username: String!) {
    getUserByUsername(username: $username) {
      id
      firstName
      lastName
      username
      profileImageURL
      followers {
        id
        firstName
        lastName
        username
        profileImageURL
      }
      following {
        id
        firstName
        lastName
        username
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
          username
          profileImageURL
        }
        hasLiked
        hasBookmarked
      }
    }
  }
`);

export const getSignedURLForProfileImageQuery = graphql(`
  query GetSignedURLForProfileImage($imageName: String!, $imageType: String!) {
    getSignedURLForProfileImage(imageName: $imageName, imageType: $imageType)
  }
`);
