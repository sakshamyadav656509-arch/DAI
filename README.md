# DoomScroll AI

YouTube-style infinite vertical feed of **AI-generated mini-games + AI memes** with no-repeat guarantees.

## Stack
- Next.js (Pages Router) + Tailwind
- Node API routes
- File-backed store for local dev (`.data/store.json`)
- Postgres schema included in `db/schema.sql`
- Ajv schema validation + Vitest tests

## Run
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Feature Coverage
- Responsive shell: top nav, desktop sidebar, mobile bottom nav, profile dropdown.
- Search, Upload/Prompt modal, seed deep links (`?seed=`), and custom generation.
- Feed cards with playable canvas, metadata, comments, and engagement buttons.
- Infinite stream endpoint with meme insertion after every 3 games.
- Strict game JSON validation and dedupe constraints:
  - global game fingerprint LRU
  - per-user seen-seed set
  - meme hash + semantic distance checks
  - retry up to 5 then deterministic remix fallback
- Personalization signals tune difficulty: likes/dislikes/saves/skips/playtime.
- Chaos mode toggle affects generation entropy.
- Safety moderation filter on generated text.
- Endpoint rate limiting for `/api/generate`.

## API
- `POST /api/generate` → unique validated game JSON
- `GET /api/stream?cursor=0&count=9` → feed batch
- `POST /api/generate-meme` → unique meme JSON
- `POST /api/engage` → like/dislike/save/play/skip/toggleChaos
- `GET|POST /api/comments?seed=...` → paginated comments + post
- `GET /api/user` → user profile stats + trending seeds

## Prompt Templates
- `prompts/game-generation-prompt.txt`
- `prompts/meme-generation-prompt.txt`

## Notes
If Canvas isn’t available, the game card shows a lightweight fallback action.
