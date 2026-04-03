# Buzz-App — Architecture & Design Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [High-Level Architecture (HLD)](#3-high-level-architecture-hld)
4. [Directory Structure](#4-directory-structure)
5. [Layer-by-Layer Breakdown](#5-layer-by-layer-breakdown)
   - [Presentation Layer](#51-presentation-layer)
   - [State Management Layer](#52-state-management-layer)
   - [Data Access Layer](#53-data-access-layer)
   - [GraphQL & Code Generation Layer](#54-graphql--code-generation-layer)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
   - [Authentication Flow](#61-authentication-flow-google-oauth)
   - [Buzz Creation Flow](#62-buzz-creation-flow-with-image-upload)
   - [Follow/Unfollow Flow](#63-followunfollow-flow)
7. [Design Patterns](#7-design-patterns)
8. [Component Architecture](#8-component-architecture)
9. [API Contract (GraphQL Schema)](#9-api-contract-graphql-schema)
10. [Environment Configuration](#10-environment-configuration)
11. [Key Architectural Decisions & Trade-offs](#11-key-architectural-decisions--trade-offs)

---

## 1. Project Overview

Buzz-App is a **social media application** organized as a monorepo with two packages:

- **`apps/client`** — Next.js 14 frontend
- **`apps/server`** — Node.js GraphQL backend (Express, Prisma, Redis)

Users can:

- Sign in with Google OAuth
- Post "Buzzes" with optional image attachments
- View a global feed of all Buzzes
- Visit user profiles and see their Buzzes
- Follow and unfollow other users
- See "Users you may know" recommendations

The client communicates exclusively with the GraphQL backend (`apps/server`). Auth is JWT-based, stored in `localStorage`.

---

## 2. Tech Stack

| Category | Technology | Version |
|---|---|---|
| Framework | Next.js (Pages Router) | ^14.2.18 |
| Language | TypeScript | ^5.7.2 |
| Styling | Tailwind CSS | ^3.3.0 |
| Server State | TanStack React Query | ^5.62.15 |
| GraphQL Client | graphql-request | ^7.1.2 |
| GraphQL Codegen | @graphql-codegen/cli + client-preset | 5.x / 4.x |
| Auth | @react-oauth/google | ^0.12.1 |
| HTTP Client | axios | ^1.7.9 |
| Notifications | react-hot-toast | ^2.5.1 |
| Icons | react-icons | ^5.3.0 |
| Runtime | Node.js | 20.x |

---

## 3. High-Level Architecture (HLD)

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     Next.js App                             │ │
│  │                                                             │ │
│  │   ┌───────────────────────────────────────────────────┐    │ │
│  │   │              Presentation Layer                   │    │ │
│  │   │   pages/index.tsx      pages/[name].tsx           │    │ │
│  │   │   components/FeedCard  components/BuzzLayout      │    │ │
│  │   └───────────────────┬───────────────────────────────┘    │ │
│  │                       │ uses                                │ │
│  │   ┌───────────────────▼───────────────────────────────┐    │ │
│  │   │           State Management Layer                  │    │ │
│  │   │         TanStack React Query v5                   │    │ │
│  │   │   hooks/buzz.ts          hooks/user.ts            │    │ │
│  │   │   QueryClient (global cache + invalidation)       │    │ │
│  │   └───────────────────┬───────────────────────────────┘    │ │
│  │                       │ calls                               │ │
│  │   ┌───────────────────▼───────────────────────────────┐    │ │
│  │   │             Data Access Layer                     │    │ │
│  │   │   clients/api.ts  (graphql-request client)        │    │ │
│  │   │   Authorization: Bearer <JWT from localStorage>   │    │ │
│  │   └───────────────────┬───────────────────────────────┘    │ │
│  │                       │ typed GQL operations                │ │
│  │   ┌───────────────────▼───────────────────────────────┐    │ │
│  │   │          GraphQL Operations Layer                 │    │ │
│  │   │   graphql/query/*.ts   graphql/mutations/*.ts     │    │ │
│  │   │   gql/ (auto-generated types & document nodes)    │    │ │
│  │   └───────────────────┬───────────────────────────────┘    │ │
│  └───────────────────────┼─────────────────────────────────────┘ │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTPS / GraphQL over HTTP
          ┌────────────────▼────────────────┐
          │         GraphQL Backend         │
          │      (apps/server / Node.js)      │
          │   Queries:  getAllBuzzs,         │
          │             getCurrentUser,      │
          │             getUserById,         │
          │             verifyGoogleToken,   │
          │             getSignedURLForBuzz  │
          │   Mutations: createBuzz,         │
          │              followUser,         │
          │              unfollowUser        │
          └────────────────┬────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │         AWS S3 Bucket           │
          │  (Direct upload via signed URL) │
          └─────────────────────────────────┘
```

The client is **purely CSR (Client-Side Rendered)** — there are no `getServerSideProps` or `getStaticProps` calls. All data fetching happens in the browser via React Query after hydration.

---

## 4. Directory Structure

```
Buzz-app/                          # Monorepo root
├── package-lock.json              # Root lockfile
│
├── apps/
│   ├── client/                    # Next.js frontend
│   │   ├── clients/
│   │   │   └── api.ts                  # Singleton GraphQL client with auth headers
│   │   │
│   │   ├── components/
│   │   │   └── FeedCard/
│   │   │       ├── index.tsx           # Buzz card (presentational)
│   │   │       └── Layout/
│   │   │           └── BuzzLayout.tsx  # App shell: sidebar nav + feed column + right panel
│   │   │
│   │   ├── graphql/                    # Hand-written GraphQL operation strings
│   │   │   ├── mutations/
│   │   │   │   ├── buzz.ts             # createBuzz
│   │   │   │   └── user.ts            # followUser, unfollowUser
│   │   │   └── query/
│   │   │       ├── buzz.ts             # getAllBuzzs, getSignedURLForBuzz
│   │   │       └── user.ts            # verifyGoogleToken, getCurrentUser, getUserById
│   │   │
│   │   ├── gql/                        # Auto-generated by graphql-codegen (DO NOT EDIT)
│   │   │   ├── graphql.ts              # All TS types + typed DocumentNode exports
│   │   │   ├── gql.ts                  # graphql() tag function
│   │   │   ├── fragment-masking.ts     # Fragment utilities
│   │   │   └── index.ts               # Re-exports
│   │   │
│   │   ├── hooks/
│   │   │   ├── buzz.ts                 # useCreateBuzz, useGetAllBuzzs
│   │   │   └── user.ts                # useCurrentUser, useGetUserById, useFollowUser, useUnfollowUser
│   │   │
│   │   ├── pages/
│   │   │   ├── _app.tsx                # Global providers: QueryClient, GoogleOAuth, Toaster
│   │   │   ├── _document.tsx           # HTML shell
│   │   │   ├── index.tsx               # Home feed page
│   │   │   ├── [name].tsx              # Dynamic user profile page
│   │   │   └── api/
│   │   │       └── hello.ts            # Default Next.js API route (unused)
│   │   │
│   │   ├── styles/
│   │   │   └── globals.css             # Tailwind base imports + global styles
│   │   │
│   │   ├── codegen.ts                  # graphql-codegen config
│   │   ├── next.config.mjs             # Next.js config (image domains allowlist)
│   │   ├── tailwind.config.ts          # Tailwind config
│   │   ├── tsconfig.json               # TypeScript config
│   │   └── global.d.ts                 # Module declarations (*.css)
│   │
│   └── server/                    # GraphQL backend
│       ├── prisma/
│       │   ├── schema.prisma           # Database schema (User, Buzz models)
│       │   └── migrations/             # Prisma migration history
│       │
│       ├── src/
│       │   ├── index.ts                # Server entry point
│       │   ├── app/
│       │   │   ├── index.ts            # Express app setup & Apollo Server
│       │   │   ├── buzz/               # Buzz module (types, queries, mutations, resolvers)
│       │   │   └── user/               # User module (types, queries, mutations, resolvers)
│       │   ├── clients/
│       │   │   ├── db/index.ts         # Prisma client singleton
│       │   │   └── redis/index.ts      # Redis client
│       │   ├── services/
│       │   │   ├── jwt.ts              # JWT signing & verification
│       │   │   ├── buzz.ts             # Buzz business logic
│       │   │   └── user.ts             # User business logic (Google auth, follow, etc.)
│       │   └── interfaces.ts           # Shared TypeScript interfaces
│       │
│       ├── package.json
│       └── tsconfig.json
```

---

## 5. Layer-by-Layer Breakdown

### 5.1 Presentation Layer

**Pages** (`pages/`)

| File | Route | Responsibility |
|---|---|---|
| `index.tsx` | `/` | Compose + global buzz feed |
| `[name].tsx` | `/:userName` | User profile, follower/following counts, follow/unfollow action |
| `_app.tsx` | — | Wraps every page with global providers |
| `_document.tsx` | — | Custom HTML document shell |

**Components** (`components/`)

| Component | Type | Responsibility |
|---|---|---|
| `BuzzLayout` | Layout / Container | Three-column shell (sidebar + feed + right panel), Google login, user chip |
| `FeedCard` | Presentational | Renders a single buzz: avatar, author name, content, optional image, action icons |

### 5.2 State Management Layer

All server state is managed by **TanStack React Query v5** via a single `QueryClient` created in `_app.tsx` and provided globally.

**Cache Keys**

| Query Key | Data |
|---|---|
| `['current-user']` | Logged-in user's full profile |
| `['all-buzzs']` | Global buzz feed |
| `['user', id]` | Any user profile by ID |

**Invalidation Strategy** — mutations invalidate related cache keys:

- `createBuzz` → invalidates `['all-buzzs']`
- `followUser` / `unfollowUser` → invalidates both `['current-user']` and `['user']` (all profile caches)

There is **no Redux, Zustand, or React Context** for state. All server-derived state lives in React Query; all ephemeral UI state (compose box text, image URL) lives in local `useState`.

### 5.3 Data Access Layer

**`clients/api.ts`** — a singleton `GraphQLClient` from `graphql-request`:

```
clients/api.ts
  └── GraphQLClient(NEXT_PUBLIC_API_URL)
        └── headers: () => { Authorization: "Bearer <token>" }
```

Key details:
- The `headers` field is a **function** (not an object), so it is re-evaluated on every request — the JWT is always read fresh from `localStorage`.
- An `isClient` guard prevents `localStorage` access during SSR.
- All hooks and components use this single client instance directly (no context injection).

### 5.4 GraphQL & Code Generation Layer

**Hand-written operations** live in `graphql/`. These use the `graphql()` tag from `gql/gql.ts`, which is the entry point generated by codegen.

**Code generation** (`codegen.ts` / `graphql-codegen`) introspects the backend schema and generates `gql/graphql.ts` containing:
- All scalar types, entity types (`User`, `Buzz`), input types (`CreateBuzzData`)
- Typed variables and response types for every operation
- `TypedDocumentNode` instances for each operation

This gives **end-to-end type safety**: the shape of every GraphQL response is known at compile time.

---

## 6. Data Flow Diagrams

### 6.1 Authentication Flow (Google OAuth)

```
User clicks "Sign in with Google"
        │
        ▼
GoogleLogin (react-oauth/google)
        │  returns CredentialResponse (JWT id_token)
        ▼
BuzzLayout.handleLoginWithGoogle()
        │
        ├─► graphqlClient.request(verifyUserGoogleTokenQuery, { token })
        │         │  (backend validates Google token, returns app JWT)
        │         ▼
        │   verifyGoogleToken: String  ← app-specific JWT
        │
        ├─► localStorage.setItem("__buzz_token", jwt)
        │
        └─► queryClient.invalidateQueries(['current-user'])
                  │
                  ▼
            useCurrentUser re-fetches
                  │
                  ▼
            UI updates: sidebar shows user avatar, right panel shows recommendations
```

### 6.2 Buzz Creation Flow (with Image Upload)

```
User types content + optionally clicks image icon
        │
        ▼
handleSelectImage()
  ├─► Creates <input type="file"> programmatically
  └─► On file select:
        ├─► graphqlClient.request(getSignedURLForBuzzQuery, { imageName, imageType })
        │         │  backend returns a pre-signed S3 PUT URL
        │         ▼
        ├─► axios.put(signedURL, file)   ← direct browser-to-S3 upload
        └─► setImageURL(s3FileURL)       ← store clean S3 object URL in state

User clicks "Buzz" button
        │
        ▼
handleCreateBuzz()
        │
        ▼
useCreateBuzz.mutateAsync({ content, imageURL })
        │  toast: "Buzzing..."
        ▼
graphqlClient.request(createBuzzMutation, { payload })
        │
        ▼
onSuccess: queryClient.invalidateQueries(['all-buzzs'])
        │  toast: "Buzzed!"
        ▼
useGetAllBuzzs re-fetches → feed updates
```

### 6.3 Follow/Unfollow Flow

```
User visits /:userName → [name].tsx
        │
        ├─► useGetUserByName(name)      → fetches profile data
        └─► useCurrentUser()            → fetches logged-in user

amIFollowing = currentUser.following.includes(profileUser.id)
        │
        ▼
Renders "Follow" or "Unfollow" button accordingly

User clicks Follow
        │
        ▼
useFollowUser.mutate(userId)
        │
        ▼
graphqlClient.request(followUserMutation, { to: userId })
        │
        ▼
onSuccess:
  ├─► invalidateQueries(['current-user'])   ← updates following list
  ├─► invalidateQueries(['user'])           ← updates profile follower count
  └─► toast.success("Followed!")
```

---

## 7. Design Patterns

### Custom Hook Pattern (Data Abstraction)
All GraphQL operations are wrapped in custom hooks (`hooks/buzz.ts`, `hooks/user.ts`). Pages and components never call `graphqlClient.request()` directly — they consume hooks. This decouples the UI from the data fetching mechanism.

```
Page/Component → Custom Hook → GraphQL Client → Backend
```

### Layout as Wrapper (Compound Component Pattern)
`BuzzLayout` accepts `children` and provides the chrome (sidebar, header, right panel) around any page content. Pages simply wrap their content in `<BuzzLayout>`. This avoids repeating navigation code across pages.

### Singleton Service (GraphQL Client)
`clients/api.ts` exports a single `graphqlClient` instance used everywhere. Auth headers are injected lazily via a function, so token changes are always reflected without re-instantiating the client.

### Cache Invalidation on Mutation
Instead of manually updating cached data after a mutation (optimistic update), the app uses **invalidation**: after a successful mutation, the relevant query keys are invalidated, triggering a background re-fetch. This keeps the cache consistent with the server.

### Typed GraphQL (Code Generation)
The `graphql()` tag function from `gql/gql.ts` links each operation string to its generated TypeScript types. This means `graphqlClient.request(query, variables)` is fully typed: wrong variables or wrong response field access are caught at compile time.

### Memoized Derived State
The `amIFollowing` boolean in `[name].tsx` is computed with `useMemo` from `currentUser.following` and the profile user's `id`, avoiding recalculation on every render.

### Programmatic File Input
Instead of rendering a `<input type="file">` in JSX and managing its visibility, the app creates the input element imperatively in `handleSelectImage`, clicks it, and discards it — keeping the UI clean while retaining native file picker behavior.

---

## 8. Component Architecture

```
_app.tsx (Providers)
├── QueryClientProvider
│   ├── GoogleOAuthProvider
│   │   ├── pages/index.tsx (Home)
│   │   │   └── BuzzLayout
│   │   │       ├── [Left Sidebar: nav links, user chip, Google login]
│   │   │       ├── [Main Feed]
│   │   │       │   ├── Compose Box (textarea + image upload + Buzz button)
│   │   │       │   └── FeedCard[]  (one per buzz)
│   │   │       └── [Right Sidebar: recommendations / login prompt]
│   │   │
│   │   └── pages/[name].tsx (User Profile)
│   │       └── BuzzLayout
│   │           ├── [Left Sidebar]
│   │           ├── [Profile Content]
│   │           │   ├── Profile header (avatar, name, follow/unfollow button)
│   │           │   ├── Follower/following counts
│   │           │   └── FeedCard[]  (user's buzzes)
│   │           └── [Right Sidebar]
│   │
│   └── ReactQueryDevtools
│
└── Toaster
```

**Prop flow:**
- `BuzzLayout` receives only `children` — it fetches its own data (`useCurrentUser`) internally.
- `FeedCard` receives a `Buzz` object as `data` prop — it is a pure presentational component with no data fetching.
- Pages own all compose/interaction state (`useState`) and delegate mutations to hooks.

---

## 9. API Contract (GraphQL Schema)

### Types

```graphql
type User {
  id: ID!
  email: String!
  firstName: String!
  lastName: String
  profileImageURL: String
  buzzs: [Buzz]
  followers: [User]
  following: [User]
  recommendedUsers: [User]
  notifications: [Notification]
  bookmarks: [Bookmark]
}

type Buzz {
  id: ID!
  content: String!
  imageURL: String
  author: User!
  hasLiked: Boolean
  hasBookmarked: Boolean
}

input CreateBuzzData {
  content: String!
  imageURL: String
}
```

### Queries

| Operation | Arguments | Returns | Used By |
|---|---|---|---|
| `verifyGoogleToken` | `token: String!` | `String` (JWT) | BuzzLayout (login) |
| `getCurrentUser` | — | `User` | `useCurrentUser` |
| `getUserById` | `id: ID!` | `User` | `useGetUserById` |
| `getUserByName` | `name: String!` | `User` | `useGetUserByName` |
| `getAllBuzzs` | — | `[Buzz]` | `useGetAllBuzzs` |
| `getSignedURLForBuzz` | `imageName`, `imageType` | `String` (S3 URL) | index.tsx (upload) |

### Mutations

| Operation | Arguments | Returns | Used By |
|---|---|---|---|
| `createBuzz` | `payload: CreateBuzzData!` | `Buzz` | `useCreateBuzz` |
| `likeBuzz` | `buzzId: String!` | `Boolean` | `FeedCard` |
| `bookmarkBuzz` | `buzzId: String!` | `Boolean` | `FeedCard` |
| `followUser` | `to: ID!` | `Boolean` | `useFollowUser` |
| `unfollowUser` | `to: ID!` | `Boolean` | `useUnfollowUser` |

---

## 10. Environment Configuration

### Client (`apps/client`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | GraphQL backend endpoint (e.g. `http://localhost:8000/graphql`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 client ID |

Both variables are prefixed `NEXT_PUBLIC_` so they are inlined into the client bundle at build time.

Image domains allowed by Next.js Image Optimization (`next.config.mjs`):
- `lh3.googleusercontent.com` — Google profile pictures
- `avatars.githubusercontent.com` — GitHub avatars
- `buzz-app-images-vineet-2025.s3.ap-south-1.amazonaws.com` — buzz image uploads

### Server (`apps/server`)

The server requires its own environment variables (e.g. database URL, Redis connection, AWS S3 credentials, JWT secret, Google OAuth client ID). Refer to the server's configuration for details.

---

## 11. Key Architectural Decisions & Trade-offs

### CSR-only (no SSR/SSG)
All data is fetched client-side. This simplifies auth (JWT in localStorage is inaccessible server-side) but means the initial page load shows no content until React Query fetches data. A future improvement would be to hydrate the initial buzz feed via `getServerSideProps` or React Query's `prefetchQuery` + `dehydrate` pattern.

### No global auth context
The logged-in user is stored only in React Query's cache (`['current-user']`). Any component that needs the user calls `useCurrentUser()`. This avoids a custom auth context but means every component that calls the hook will re-render when the user cache updates.

### Direct S3 upload via signed URL
Images are uploaded directly from the browser to S3 using a pre-signed PUT URL obtained from the backend. This offloads bandwidth from the backend server and scales better than proxying uploads through the API, at the cost of slightly more complex client-side logic.

### Singleton QueryClient outside React tree
`queryClient` is created outside the component in `_app.tsx` (module scope), ensuring it survives re-renders of the `App` component without being recreated. This is the recommended pattern for Next.js Pages Router.

### graphql-codegen for type safety
Rather than maintaining types by hand, the project uses codegen to generate types from the live schema. Running `npm run codegen` regenerates `gql/graphql.ts`. The `gql` tag function then ties each query string to its exact TypeScript response type, making schema mismatches a compile error rather than a runtime bug.
