# Graveyard API

NestJS + Prisma + PostgreSQL backend for **Graveyard** — a platform that celebrates unseen creative work through a public gallery, community likes, and curated annual awards.

## Stack

- NestJS 11
- Prisma 6 + PostgreSQL 16
- JWT auth (wired next)
- Swagger at `/docs`

## Quick start

```bash
# 1. Install
npm install

# 2. Start Postgres
npm run infra

# 3. Copy env (already present locally as .env)
cp .env.example .env

# 4. Generate client + migrate + seed categories + super admin
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5. Run API
npm run start:dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/docs  
- DB: `localhost:5434` (`postgres` / `root` / `graveyard`) — port 5434 avoids clashing with other local Postgres instances

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Dev server with watch |
| `npm run infra` | Start Postgres via Docker |
| `npm run prisma:migrate` | Create/apply migrations |
| `npm run prisma:seed` | Seed categories + super admin |
| `npm run prisma:studio` | Open Prisma Studio |

## Domain (MVP)

Users submit drafts → publish to public gallery → community likes → judges score in award cycles → admin publishes shortlist/winners → featured items spotlight work.

## API (current)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Login |
| GET | `/auth/me` | Bearer | Current user |
| GET | `/categories` | No | Active categories |
| GET | `/submissions` | No | Browse published work |
| GET | `/submissions/:slug` | No | Published submission detail |
| GET | `/submissions/mine` | Bearer | My submissions |
| GET | `/submissions/mine/:id` | Bearer | My submission by id |
| POST | `/submissions` | Bearer | Create draft |
| PATCH | `/submissions/:id` | Bearer | Update draft |
| POST | `/submissions/:id/publish` | Bearer | Publish draft |
| DELETE | `/submissions/:id` | Bearer | Delete draft |
| POST | `/submissions/:id/assets/upload` | Bearer | Upload image/video/PDF (multipart) |
| POST | `/submissions/:id/assets/link` | Bearer | Attach external deck/link |
| PATCH | `/submissions/:id/assets/:assetId` | Bearer | Update cover/sort |
| DELETE | `/submissions/:id/assets/:assetId` | Bearer | Remove asset |
| POST | `/submissions/:id/like` | Bearer | Like published work |
| DELETE | `/submissions/:id/like` | Bearer | Unlike |
| GET | `/leaderboard/works` | No | Weekly most-liked works (Mon 00:00 UTC) |
| GET | `/leaderboard/creators` | No | Weekly rising creators by likes |
| GET | `/featured` | No | Currently active featured spotlights |
| GET | `/featured/admin` | Admin | All featured items |
| POST | `/featured` | Admin | Feature a published submission |
| PATCH | `/featured/:id` | Admin | Update featured item |
| POST | `/featured/:id/deactivate` | Admin | Soft-disable featured item |
| DELETE | `/featured/:id` | Admin | Delete featured item |
| GET | `/award-cycles` | No | List award cycles |
| GET | `/award-cycles/:id` | No | Cycle detail + judges |
| POST | `/award-cycles` | Admin | Create cycle |
| PATCH | `/award-cycles/:id` | Admin | Update cycle / status |
| POST | `/award-cycles/:id/judges` | Admin | Assign judge (promotes CREATOR → JUDGE) |
| DELETE | `/award-cycles/:id/judges/:userId` | Admin | Remove judge |
| POST | `/award-cycles/:id/submissions/enter` | Admin | Move submissions into UNDER_REVIEW |
| GET | `/award-cycles/:id/queue` | Judge/Admin | Judging queue |
| POST | `/award-cycles/:id/scores` | Judge/Admin | Upsert rubric score (1–10 × 4) |
| GET | `/award-cycles/:id/scores/mine` | Judge/Admin | My scores |
| GET | `/award-cycles/:id/scores` | Admin | All cycle scores |
| GET | `/award-cycles/:id/scoreboard` | Admin | Avg totals for shortlist decisions |
| POST | `/award-cycles/:id/results` | Admin | Publish shortlist / winners |
| GET | `/award-cycles/:id/results` | No* | Public results (*cycle must be published) |
| GET | `/award-cycles/:id/results/admin` | Admin | All results even while judging |
| DELETE | `/award-cycles/:id/results/:submissionId` | Admin | Remove a result |
| GET | `/showcase` | No | Public winners/finalists browse |

**Assets:** upload images/videos/PDFs to drafts (`multipart/form-data`), or attach external links (decks, Figma, Vimeo, etc.). Publishing requires at least one asset. Explore interactive docs at `/docs`.

### File storage (local or Cloudflare R2)

Uploads go through `ObjectStorage`. Set `STORAGE_DRIVER`:

| Driver | Behavior |
|--------|----------|
| `local` (default) | Writes under `uploads/` and serves via `/uploads/...` |
| `r2` | Puts objects in Cloudflare R2; `Asset.url` is `R2_PUBLIC_BASE_URL/<key>` |

R2 setup (Cloudflare dashboard):

1. Create an R2 bucket (e.g. `graveyard-assets`)
2. Enable a public bucket URL **or** attach a custom domain → that becomes `R2_PUBLIC_BASE_URL`
3. Create an R2 API token with Object Read & Write → `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`
4. Copy Account ID → `R2_ACCOUNT_ID`

```env
STORAGE_DRIVER=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=graveyard-assets
R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev
```

Object keys look like `submissions/<submissionId>/<timestamp>-<hash>.ext`. Deletes remove managed objects; external link assets are left alone.

### Super admin seed

`npm run prisma:seed` upserts an `ADMIN` from env (see `.env.example`):

| Var | Default |
|-----|---------|
| `SEED_ADMIN_EMAIL` | `admin@graveyard.local` |
| `SEED_ADMIN_PASSWORD` | `ChangeMeAdmin1!` |
| `SEED_ADMIN_NAME` | `Super Admin` |
| `SEED_ADMIN_RESET_PASSWORD` | `true` (resets password on each seed) |

Log in with that account, then manage staff via admin APIs / portal.

### Roles

| Role | Portal access |
|------|----------------|
| `JUDGE` | Cycles + judging queue/scoring |
| `ADMIN` | Cycles management + Featured (inherits judge access) |
| `SUPER_ADMIN` | Everything above + People (user management) |

`SUPER_ADMIN` satisfies `ADMIN` routes in the roles guard. Seed creates `SUPER_ADMIN`.

### User management (`SUPER_ADMIN` only)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/users` | List/search (`role`, `q`, `page`, `limit`) |
| POST | `/users` | Create `ADMIN` or `JUDGE` account |
| POST | `/users/upgrade` | Upgrade existing user by email → `JUDGE` or `ADMIN` |
| PATCH | `/users/:id/role` | Set role by id |

Public `POST /auth/register` still always creates `CREATOR`. Role changes require a fresh login for JWT.

### Profile

Any authenticated user can update their own profile:

| Method | Path | Notes |
|--------|------|--------|
| PATCH | `/auth/me` | Update `name`, `bio`, `agencyName` |
| POST | `/auth/me/avatar` | Upload profile image (multipart, max 5MB) |
| DELETE | `/auth/me/avatar` | Remove profile image |

Avatars use the same storage driver as submission assets (`local` or `r2`).

**Judging flow:** create cycle → assign judges → enter submissions → judges score via queue → admin scoreboard → publish shortlist/winners → public `/showcase`.
