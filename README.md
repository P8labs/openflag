# Openflag MVP

Openflag is a developer + creator matching platform with a swipe-first experience.

Core loop:

1. Discover cards (users and projects)
2. Evaluate quickly in-place
3. Swipe right/left
4. Create matches

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- HeroUI v3
- Better Auth (GitHub OAuth)
- Prisma + PostgreSQL
- TanStack Query (infinite feed)
- Framer Motion (swipe interactions)

## Local Setup

1. Copy [.env.example](.env.example) to `.env` and fill in values.
2. Install deps:

```bash
pnpm install
```

3. Generate Prisma client and run migrations:

```bash
pnpm prisma:generate
pnpm prisma:migrate --name init
```

4. Seed demo data for the feed and match views:

```bash
pnpm prisma:seed
```

5. Run development server:

```bash
pnpm dev
```

## Auth + Onboarding

- GitHub is the only sign-in provider.
- First authenticated page load triggers GitHub profile/repo sync.
- Only meaningful profile data is persisted:
  - username, avatar, bio
  - derived skills (from languages + topics)
  - top repositories only

## Matching Rules

- `RIGHT` swipe on user creates interest.
- User-user match is created when both users swipe `RIGHT`.
- `RIGHT` swipe on project creates interest and auto-accepts in MVP.
- Swipes are stored with unique constraints for idempotency.

## Feed

- Infinite card stack UI (not list-based).
- Mixed user/project cards from one feed endpoint.
- Cursor-based pagination.
- Relevance scoring based on:
  - skill overlap
  - interest overlap
  - recent activity bonus

## Quality Constraints

- Profile completion required before swiping.
- Daily swipe limit on API.
- Session swipe limit on client.

## Manifesto Mode

Set `OPENFLAG_MANIFESTO_MODE=true` to replace the swipe app with the manifesto landing page.
In production, this mode keeps only the main manifesto page available and hides the product flow.
