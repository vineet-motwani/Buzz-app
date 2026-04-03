import { graphql } from "@/gql";

export const getAllBuzzsQuery = graphql(`
    query GetAllBuzzs {
        getAllBuzzs {
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
`);

export const getSignedURLForBuzzQuery = graphql(`
  query GetSignedURL($imageName: String!, $imageType: String!) {
    getSignedURLForBuzz(imageName: $imageName, imageType: $imageType)
  }
`);
