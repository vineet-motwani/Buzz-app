/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
    "\n  mutation LikeBuzz($buzzId: String!) {\n    likeBuzz(buzzId: $buzzId)\n  }\n": types.LikeBuzzDocument,
    "\n  mutation BookmarkBuzz($buzzId: String!) {\n    bookmarkBuzz(buzzId: $buzzId)\n  }\n": types.BookmarkBuzzDocument,
    "\n  #graphql\n  mutation CreateBuzz($payload: CreateBuzzData!) {\n    createBuzz(payload: $payload) {\n      id\n    }\n  }\n": types.CreateBuzzDocument,
    "\n  #graphql\n  mutation FollowUser($to: ID!) {\n    followUser(to: $to)\n  }\n": types.FollowUserDocument,
    "\n  #graphql\n  mutation UnfollowUser($to: ID!) {\n    unfollowUser(to: $to)\n  }\n": types.UnfollowUserDocument,
    "\n    query GetAllBuzzs {\n        getAllBuzzs {\n            id\n            content\n            imageURL\n            author {\n                id\n                firstName\n                lastName\n                profileImageURL\n            }\n            hasLiked\n            hasBookmarked\n        }\n    }\n": types.GetAllBuzzsDocument,
    "\n  query GetSignedURL($imageName: String!, $imageType: String!) {\n    getSignedURLForBuzz(imageName: $imageName, imageType: $imageType)\n  }\n": types.GetSignedUrlDocument,
    "\n  query VerifyUserGoogleToken($token: String!) {\n    verifyGoogleToken(token: $token)\n  }\n": types.VerifyUserGoogleTokenDocument,
    "\n  query GetCurrentUser {\n    getCurrentUser {\n      id\n      profileImageURL\n      email\n      firstName\n      lastName\n      recommendedUsers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      followers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      following {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      buzzs {\n        id\n        content\n        imageURL\n        author {\n          id\n          firstName\n          lastName\n          profileImageURL\n        }\n        hasLiked\n        hasBookmarked\n      }\n      notifications {\n        id\n        content\n        createdAt\n      }\n      bookmarks {\n        id\n        createdAt\n        buzz {\n          id\n          content\n          imageURL\n          author {\n            id\n            firstName\n            lastName\n            profileImageURL\n          }\n          hasLiked\n          hasBookmarked\n        }\n      }\n    }\n  }\n": types.GetCurrentUserDocument,
    "\n  query GetUserById($id: ID!) {\n    getUserById(id: $id) {\n      id\n      firstName\n      lastName\n      profileImageURL\n      followers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      following {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      buzzs {\n        content\n        id\n        imageURL\n        author {\n          id\n          firstName\n          lastName\n          profileImageURL\n        }\n        hasLiked\n        hasBookmarked\n      }\n    }\n  }\n": types.GetUserByIdDocument,
    "\n  query GetUserByName($name: String!) {\n    getUserByName(name: $name) {\n      id\n      firstName\n      lastName\n      profileImageURL\n      followers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      following {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      buzzs {\n        content\n        id\n        imageURL\n        author {\n          id\n          firstName\n          lastName\n          profileImageURL\n        }\n        hasLiked\n        hasBookmarked\n      }\n    }\n  }\n": types.GetUserByNameDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LikeBuzz($buzzId: String!) {\n    likeBuzz(buzzId: $buzzId)\n  }\n"): (typeof documents)["\n  mutation LikeBuzz($buzzId: String!) {\n    likeBuzz(buzzId: $buzzId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BookmarkBuzz($buzzId: String!) {\n    bookmarkBuzz(buzzId: $buzzId)\n  }\n"): (typeof documents)["\n  mutation BookmarkBuzz($buzzId: String!) {\n    bookmarkBuzz(buzzId: $buzzId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  #graphql\n  mutation CreateBuzz($payload: CreateBuzzData!) {\n    createBuzz(payload: $payload) {\n      id\n    }\n  }\n"): (typeof documents)["\n  #graphql\n  mutation CreateBuzz($payload: CreateBuzzData!) {\n    createBuzz(payload: $payload) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  #graphql\n  mutation FollowUser($to: ID!) {\n    followUser(to: $to)\n  }\n"): (typeof documents)["\n  #graphql\n  mutation FollowUser($to: ID!) {\n    followUser(to: $to)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  #graphql\n  mutation UnfollowUser($to: ID!) {\n    unfollowUser(to: $to)\n  }\n"): (typeof documents)["\n  #graphql\n  mutation UnfollowUser($to: ID!) {\n    unfollowUser(to: $to)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetAllBuzzs {\n        getAllBuzzs {\n            id\n            content\n            imageURL\n            author {\n                id\n                firstName\n                lastName\n                profileImageURL\n            }\n            hasLiked\n            hasBookmarked\n        }\n    }\n"): (typeof documents)["\n    query GetAllBuzzs {\n        getAllBuzzs {\n            id\n            content\n            imageURL\n            author {\n                id\n                firstName\n                lastName\n                profileImageURL\n            }\n            hasLiked\n            hasBookmarked\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSignedURL($imageName: String!, $imageType: String!) {\n    getSignedURLForBuzz(imageName: $imageName, imageType: $imageType)\n  }\n"): (typeof documents)["\n  query GetSignedURL($imageName: String!, $imageType: String!) {\n    getSignedURLForBuzz(imageName: $imageName, imageType: $imageType)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query VerifyUserGoogleToken($token: String!) {\n    verifyGoogleToken(token: $token)\n  }\n"): (typeof documents)["\n  query VerifyUserGoogleToken($token: String!) {\n    verifyGoogleToken(token: $token)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetCurrentUser {\n    getCurrentUser {\n      id\n      profileImageURL\n      email\n      firstName\n      lastName\n      recommendedUsers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      followers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      following {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      buzzs {\n        id\n        content\n        imageURL\n        author {\n          id\n          firstName\n          lastName\n          profileImageURL\n        }\n        hasLiked\n        hasBookmarked\n      }\n      notifications {\n        id\n        content\n        createdAt\n      }\n      bookmarks {\n        id\n        createdAt\n        buzz {\n          id\n          content\n          imageURL\n          author {\n            id\n            firstName\n            lastName\n            profileImageURL\n          }\n          hasLiked\n          hasBookmarked\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetCurrentUser {\n    getCurrentUser {\n      id\n      profileImageURL\n      email\n      firstName\n      lastName\n      recommendedUsers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      followers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      following {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      buzzs {\n        id\n        content\n        imageURL\n        author {\n          id\n          firstName\n          lastName\n          profileImageURL\n        }\n        hasLiked\n        hasBookmarked\n      }\n      notifications {\n        id\n        content\n        createdAt\n      }\n      bookmarks {\n        id\n        createdAt\n        buzz {\n          id\n          content\n          imageURL\n          author {\n            id\n            firstName\n            lastName\n            profileImageURL\n          }\n          hasLiked\n          hasBookmarked\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetUserById($id: ID!) {\n    getUserById(id: $id) {\n      id\n      firstName\n      lastName\n      profileImageURL\n      followers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      following {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      buzzs {\n        content\n        id\n        imageURL\n        author {\n          id\n          firstName\n          lastName\n          profileImageURL\n        }\n        hasLiked\n        hasBookmarked\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetUserById($id: ID!) {\n    getUserById(id: $id) {\n      id\n      firstName\n      lastName\n      profileImageURL\n      followers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      following {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      buzzs {\n        content\n        id\n        imageURL\n        author {\n          id\n          firstName\n          lastName\n          profileImageURL\n        }\n        hasLiked\n        hasBookmarked\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetUserByName($name: String!) {\n    getUserByName(name: $name) {\n      id\n      firstName\n      lastName\n      profileImageURL\n      followers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      following {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      buzzs {\n        content\n        id\n        imageURL\n        author {\n          id\n          firstName\n          lastName\n          profileImageURL\n        }\n        hasLiked\n        hasBookmarked\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetUserByName($name: String!) {\n    getUserByName(name: $name) {\n      id\n      firstName\n      lastName\n      profileImageURL\n      followers {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      following {\n        id\n        firstName\n        lastName\n        profileImageURL\n      }\n      buzzs {\n        content\n        id\n        imageURL\n        author {\n          id\n          firstName\n          lastName\n          profileImageURL\n        }\n        hasLiked\n        hasBookmarked\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;