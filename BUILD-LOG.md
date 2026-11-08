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

## Parity fold-in — hosted edition's newest fixes (2026-11-07, second push)

Folded in from the Muse-hosted edition's post-launch fixes, implemented
natively in this codebase (no artifact-runtime workarounds ported):

1. **Upload type auto-detect (My Media).** The page detects the media kind
   from the chosen file itself (MIME type first, extension fallback). If the
   file's real kind differs from the File-type control, the type switches
   automatically with a plain EN+தமிழ் notice; a "Logo" pick stands only for
   real image files (the logo flag is ignored for non-images). The file
   picker's `accept` filter follows the selected kind. The upload now sends
   the API's JSON contract (the old page posted FormData the API could not
   parse, so UI uploads failed) with reading/uploading phases; after ANY
   failure the form fully resets for an immediate retry, and errors are
   mapped to plain bilingual sentences — raw status codes/JSON are never
   shown (client-side sanitiser as a backstop). Server-side, the media API
   also corrects the kind from the file's own content type and returns only
   bilingual human error sentences.
2. **Video playback chain.** (a) My Media rows already rendered a real
   `<video controls>` from the stored Blob URL — kept, hardened with
   `playsInline`/`preload`. (b) `DesignScene` previously rendered ANY placed
   media as an `<img>`, so a placed video could never play — it now renders
   a real autoplaying muted looping `<video>` for video media, replacing
   the built-in scene in the Studio preview and everywhere the scene is
   used. (c) The creatives GET now LEFT JOINs the media table and returns
   the resolved `media_url`/`media_kind` (plus logo/audio URLs), so a saved
   creative cannot silently lose its media the way the hosted edition did;
   the Studio's creative library renders each saved creative as a live
   scene — placed videos play in the card. (d) **Export & Share did not
   exist in this edition at all** — built `src/components/ExportShare.tsx`:
   canvas export at 1:1 1080×1080, 9:16 1080×1920, 16:9 1920×1080,
   4:5 1080×1350 (PNG/JPEG); when the composition includes the member's own
   video, a real video export records that same video element with the
   design + watermark drawn over it, named honestly by the format the
   browser's recorder actually produced (MP4 or WebM); share = device share
   sheet with the file, or download fallback — never a fake "posted" state;
   watermark "ViralAI by FARFAZ" burned into every export, forced ON for
   Free accounts, Premium may toggle per export (rule stated EN+TA in the
   panel). If the media's storage blocks canvas reads (tainted canvas), the
   panel says so honestly and points to the My Media original.
3. **Session persistence.** Verified first: the session cookie was already
   a persistent httpOnly 30-day cookie (hashed-token server sessions), so
   sign-in already survives browser close. Added the missing control: a
   "Keep me signed in on this device" checkbox on the auth form, ON by
   default — unticking issues a browser-session cookie instead. Added the
   missing autocomplete attributes (`name`, `username`/`email`;
   `current-password`/`new-password` were already correct). The app never
   stores a raw password.
4. **My Media row actions + next steps.** Every file row now has
   "Use in Studio"; video rows also get "Make a video ad" (opens a free
   9:16 video-style design with the video placed). The Studio shows a
   placed-confirmation next-step strip, and My Media shows a next-step
   strip after a successful upload ("Use in Studio → words → Save →
   Export & Share"), EN+TA.
5. **Floating hologram cards + imagery chips.** `.card.holo` in the global
   stylesheet: gentle staggered CSS float, holographic sheen sweep on
   hover, small pointer tilt on fine pointers only, `animation-play-state`
   paused on hover — CSS only, no WebGL, fully static under
   `prefers-reduced-motion`. Applied to Library, Showcase, Stores,
   My Media, Studio creative library and the dashboard KPI cards. Product
   cards are chipped "Shop's own photo" when the store uploaded its own
   media photo, else "Built-in illustration" (EN+TA) — no fake imagery;
   the Marketplace header carries a scene banner stating the chip rule.
   Store logos use the same uploaded-media URL treatment as product photos
   (stores have no separate logo field in this edition — the product photo
   IS the store's uploaded media, resolved via the same media join).

- **Not applicable here:** the hosted edition's chunked-upload/resume and
  its localStorage/sessionStorage session workaround are artifact-runtime
  fixes; this edition uploads in one JSON request to its own API and uses
  real server cookies, so neither was ported. No migration was needed (the
  creatives `data` JSONB column and all media columns already exist).
- **Verification (2026-11-07, local, no database):** `npx tsc --noEmit`
  clean; `npm run build` clean (all routes generated); production-server
  smoke test with no env — landing 200, `/auth` 200, manifest 200, and
  `/api/public`, `/api/bootstrap`, `POST /api/auth` all return the honest
  `503 SETUP_PENDING`. Database-backed flows (including a live Blob upload
  → playback → export round-trip) still run first at Stage 3 on the
  owner's Vercel deployment, as before.

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

## FIX — session check endpoint (2026-11-07, third push)

- **Bug (audit F1, critical):** the client shell's `useMe()` checks the
  session with `GET /api/auth`, but `src/app/api/auth/route.ts` exported
  only POST — the GET returned **405**, the client treated every visitor
  as logged out forever, and the member area was unreachable ("Please
  sign in first" even immediately after a successful sign-in; Owner
  Control rejected the owner; tab navigation never rendered).
- **Fix:** added a `GET` handler to the same route returning exactly the
  payload the client already parses — the same `{user, position}` shape
  as the sign-in/sign-up POST, built from the existing `currentUser()`
  helper. Signed out returns HTTP 200 with `user: null` (a normal state,
  not an error), so the client helper neither throws nor files an Error
  Inbox report per page load. No client change, no new tables, no
  migration.
- **Verification (2026-11-07, local, no database):** `npx tsc --noEmit`
  clean; `npm run build` clean; no-env production-server smoke test
  unchanged (landing/`/auth`/manifest 200; `/api/public`,
  `/api/bootstrap`, `POST /api/auth` — and now `GET /api/auth` too —
  return the honest `503 SETUP_PENDING`). Live post-deploy check of the
  logged-out GET is recorded with the push.

## Store Owner Dashboard + buyer→store contact (2026-11-08, fourth push)

Owner-ordered from his Stores-page screenshot: store owners need their OWN
dashboard — their products with image + price, more for store people and
delivery people, and a clear way for buyers to contact the store.

- **New page `/app/store-dashboard`** ("My Store · என் கடை"; tab in the nav
  and linked from the Stores page): my stores; per store its products with
  photo (existing media join; "Shop's own photo" / "Built-in illustration"
  chips) and **inline price + stock edit** through the existing
  `updateProduct` action; orders received with buyer name/phone/address
  visible ONLY to that order's seller (rule unchanged), status timeline +
  the seller's existing status/payment controls; **sales totals computed
  server-side from stored orders, grouped by status** (headline figure
  excludes cancelled, labelled as totals from orders recorded in the
  system); low-stock shelf (stock ≤ 3) from real rows. Honest empty
  states throughout.
- **Delivery section on the same dashboard** for registered delivery
  partners: claimed deliveries with step controls, per-delivery fee, and
  completed-count + fees-earned totals from real rows (same data as
  `/api/delivery`). Non-partners see an honest "register first" prompt.
- **Buyer → store contact:** a "Contact store" box on every other person's
  store card records an enquiry (new table `store_enquiries`, migration
  **0008**) and notifies the seller; the seller reads enquiries in the
  dashboard; buyers see their sent messages in My Orders and in the
  dashboard. Labelled honestly EN+TA as a recorded message the seller
  reads in their dashboard — NOT live chat, no fake messaging. (This
  edition had no vendor lead/enquiry store to reuse — `/api/partners` is
  the programme directory — so the smallest stored enquiry was added.)
- **New API `GET /api/store-dashboard`** aggregates all of the above from
  stored rows. Until migration 0008 has been run it returns
  `enquiriesReady: false` and the UI shows a bilingual "being set up"
  note instead of erroring; `POST /api/stores` action `contactStore`
  likewise returns a bilingual setup message until the table exists.
- **Production step (owner, one small paste):** run
  `migrations/0008_store_enquiries.sql` once in the Neon SQL Editor.
  Everything else in this push works without it; only store messages wait.
- **Verification (2026-11-08, local, no database):** `npx tsc --noEmit`
  clean; `npm run build` clean (new routes `/app/store-dashboard` and
  `/api/store-dashboard` generated); no-env production smoke — `/`,
  `/auth`, `/app/store-dashboard`, manifest 200; `/api/public`,
  `/api/bootstrap`, `/api/store-dashboard`, `/api/stores` and POST
  `contactStore` all return the honest `503 SETUP_PENDING`. Live
  read-only verification is recorded with the push; no accounts or stores
  were created on production.
