import { GraphQLClient } from 'graphql-request'

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

export const graphqlClient = new GraphQLClient(apiUrl, {
    credentials: 'include',
});
