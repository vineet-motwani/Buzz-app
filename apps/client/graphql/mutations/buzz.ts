import { graphql } from "@/gql";

export const createBuzzMutation = graphql(`
  #graphql
  mutation CreateBuzz($payload: CreateBuzzData!) {
    createBuzz(payload: $payload) {
      id
    }
  }
`);