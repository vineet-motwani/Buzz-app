import { GraphQLClient } from 'graphql-request'

const isClient = typeof window !== 'undefined';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

export const graphqlClient = new GraphQLClient(apiUrl, {
    headers: () => ({
        Authorization: isClient ? `Bearer ${window.localStorage.getItem("__buzz_token")}`
        : "",
    })
});
