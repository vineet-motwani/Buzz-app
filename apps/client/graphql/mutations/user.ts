import { graphql } from "@/gql";

export const followUserMutation = graphql(`
  #graphql
  mutation FollowUser($to: ID!) {
    followUser(to: $to)
  }
`);

export const unfollowUserMutation = graphql(`
  #graphql
  mutation UnfollowUser($to: ID!) {
    unfollowUser(to: $to)
  }
`);

export const updateUserProfileMutation = graphql(`
  #graphql
  mutation UpdateUserProfile($payload: UpdateUserProfileData!) {
    updateUserProfile(payload: $payload) {
      id
      firstName
      lastName
      profileImageURL
    }
  }
`);
