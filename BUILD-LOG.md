# Build Log — ViralAI by FARFAZ (public edition)

## Stack choices
- **Data layer:** `pg` driver + a small typed helper (`src/lib/db.ts`:
  `q` / `q1` / `tx`). Chosen over Prisma/Drizzle: fewer moving parts, works
  unchanged against Neon (pooled or direct), migrations stay plain SQL.
- **Passwords:** Node `crypto.scrypt`, stored as `scrypt:<salt>:<hash>`.
- **Sessions:** random token cookie (`viralai_session`, httpOnly, 30 days);
  only the SHA-256 hash of the token is stored.
- **Media:** Vercel Blob (`@vercel/blob`). Without `BLOB_READ_WRITE_TOKEN`,
  uploads return an honest `MEDIA_SETUP_PENDING` message. Swap point documented
  in `src/lib/blob.ts` (Cloudinary ~25 GB free / Cloudflare R2).
- **QR codes:** generated server-side as SVG (`qrcode`) from the owner's own
  UPI address + exact amount — never an uploaded image.
- **CSS:** one plain stylesheet, cyber-luxe theme; no framework.

## Feature parity (with the verified Muse-hosted build)
Accounts + owner bootstrap (first account = Owner + Founder #1) · Founders
(first 1,000 accounts, 90 free Premium days) · referral (+14d invitee, +7d per
ACTIVATED invite — activation = invitee's first self-created campaign — +30d
per 5, 12-month rolling cap) · campaigns & creatives CRUD with 6 deletable
SAMPLE seeds · Design Library generated (26 families × 10 kinds × 4 sizes ×
2 themes = 2,080 computed) + 11 showcase designs, server-side Premium gate on
save/attach · 48 business categories + picker (≤3, skippable) · own-media
uploads (5/5/10/25 MB, rights checkbox) · Stores + Marketplace with
server-recomputed totals and duplicate-order guard (`UNIQUE(buyer, clientKey)`)
· Delivery Partners (details hidden until claim, atomic first-claim-wins,
store-set fees, platform fee starts 0%) · Autopilot tier engine (positions from
real records; autopilot prepares drafts only — never publishes/spends/charges)
· Team Workspaces (server-enforced Admin/Editor/Approver/Viewer, departments,
invites, approvals with mandatory comments, handovers, notifications) ·
Partners & Earnings (14 partners REGISTERED, owner-editable https link slots,
deduped click/signup counters, earnings honestly ₹0 until a programme pays,
4 EN+TA outreach templates) · Owner Control (Members & Access with
PAID / OWNER-GIFTED / SYSTEM-FREE / FREE positions, grants Basic/High ×
1/3/6 months / 1 year / custom days with private note, end-early, suspend /
reactivate, audit log; Payments inbox with approve → stacked premium periods
(monthly = Basic 30d, yearly = High 365d); country payment registry — India UPI
LIVE, Canada + rest = wire with EMPTY owner-filled fields; Donations board with
confirm/reject, manual-add, confirmed-only totals, opt-in thank-you wall,
"QR shown in app" view counter; Exception Centre; Health Board — backup
honestly "not available on this host"; Error Inbox with retry/resolve) ·
Kill Switch + Master Guardrails (auto-publish permanently off) · World Map
board from real stored counts · 17 house-ad Showcase with owner manager ·
Growth page with origin-built `?ref=` share texts EN+TA · installable PWA
(manifest + 192/512 maskable + apple-touch icons) · Google sign-in button
present but disabled with REGISTERED status — no fake login, no Google
password ever collected.

## Seed data honesty
- The ONLY payment value seeded is the owner's own India UPI receiving address
  (`payment_settings`), supplied by the owner for public display.
- Plan prices start NULL ("Price set by owner soon"). Wire fields start EMPTY.
- Earnings are hard-coded ₹0 until the owner records a partner as joined AND a
  programme pays — nothing is invented.

## Verification (2026-11-07, local, no database configured)
- `npx tsc --noEmit` — clean.
- `npm run build` — clean production build; all 20 API routes dynamic, all
  pages generated (23 routes). Build does not touch the database.
- Runtime smoke test on the production server (no env): landing 200,
  `/auth` 200, manifest 200; `/api/public`, `/api/bootstrap` and
  `POST /api/auth` all return the honest `503 SETUP_PENDING`
  ("Database is being set up.") instead of crashing.

## Known approximations / incompletes
- The Library's category-fitted shelf uses a simple deterministic pick
  (every 97th design, max 8) rather than a curated category→family mapping;
  counts, filters and Premium gating are exact.
- Full video-timeline editing for uploaded media is a registered later step
  (stated in the Media UI).
- The PNG icons are binary and therefore excluded from the text-only GitHub
  snapshot push; `scripts/generate-icons.mjs` regenerates them byte-consistently
  from code, and `/public/icon.svg` (text) is listed first in the manifest and
  layout so installs still get the orbit-core icon.
- End-to-end database flows (signup → order → delivery → payment approval)
  were NOT re-run locally because no Neon database exists yet; they run at
  Stage 3 on the owner's Vercel deployment. The same flows were verified
  end-to-end in the Muse-hosted build this edition mirrors.
