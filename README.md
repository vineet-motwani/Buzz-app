# Buzz

A Twitter-like social media platform built with Next.js, GraphQL, and PostgreSQL.

## Tech Stack

**Frontend:** Next.js 16, React 18, Tailwind CSS, React Query, graphql-request, emoji-mart

**Backend:** Express, Apollo Server (GraphQL), Prisma ORM, PostgreSQL, Redis, JWT auth

**Infrastructure:** GCP (e2-micro Free Tier), Caddy (auto HTTPS), PM2, Terraform

**Storage:** AWS S3 (image uploads via signed URLs)

## Features

- Google OAuth authentication
- Create, like, and bookmark posts ("Buzzs")
- Image uploads with client-side compression
- Follow/unfollow users with friend-of-friend recommendations
- Notifications on likes
- Emoji picker + WhatsApp-style shortcode support (`:fire:` → 🔥)
- Responsive Twitter-style layout
- Redis-powered rate limiting and caching

## Project Structure

```
apps/
  client/     Next.js frontend (deployed on Vercel)
  server/     Express + Apollo GraphQL backend (deployed on GCP)
  terraform/  Infrastructure as code (GCP Free Tier)
```

## Local Development

```bash
# Backend
cd apps/server
cp .env.example .env  # fill in values
npm install
npx prisma generate
npm run dev            # runs on :8000

# Frontend
cd apps/client
cp .env.example .env  # fill in values
npm install
npm run dev            # runs on :3000
```

## Deployment

See [HOSTING.md](./HOSTING.md) for full deployment instructions.

- **Frontend:** Vercel (auto-deploys on push to `main`)
- **Backend:** GCP e2-micro via Terraform + Caddy reverse proxy
- **Live at:** [buzz.vineet-motwani.cv](https://buzz.vineet-motwani.cv)

## License

MIT
