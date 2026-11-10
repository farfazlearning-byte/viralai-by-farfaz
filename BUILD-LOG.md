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

## FIX — Founder-number race + Plans/Strategy/Owner navigation stall (2026-11-08)
- Founder numbers: sign-up assigned them with a COUNT(*)+1 read-then-insert;
  parallel sign-ups shared numbers (load test: 408 duplicates in 1,000;
  local reproduction: 50 parallel sign-ups -> only 39 distinct). Now claimed
  atomically from a `founder_counter` settings row with a single
  UPDATE ... RETURNING (src/app/api/auth/route.ts, claimFounderSlot);
  migration 0009 seeds the counter from MAX(founder_number)+1 and the code
  self-initialises if the row is missing. Verified on a local throwaway DB:
  50 parallel sign-ups -> 50 distinct, consecutive numbers, 0 collisions
  with existing accounts, exactly 1 owner.
- Navigation stall (owner-reported: tapping Plans / Strategy / Owner
  Control "did nothing" while signed in as Owner): the three pages were
  written against a different API contract than the server returns. Plans
  cast the plans OBJECT to an array and called .map() on it (TypeError the
  moment real data loaded); Strategy and Owner Control read
  position.level where the API returns position.tier (TypeError on load);
  and the app had NO error boundary anywhere, so each throw killed the
  client navigation silently and the previous page stayed on screen.
  Signed-out checks never reproduced it because the throwing data only
  loads for a signed-in user. The pages now map the real contract, data
  loads fail visibly in a bilingual ErrBox, and a root src/app/error.tsx
  boundary shows a bilingual recovery card if any render ever throws again.
- Found in the same audit of those pages: the Owner donations board loaded
  the public GET payload and stayed permanently blank — it now uses
  POST {action:"board"} (totals gained todayCount); donations `decide`
  read only `approve` while the page sends `confirm`, so the owner's
  "Confirm" tap actually REJECTED donations — both fields are now honoured
  (verified end-to-end: record -> confirm -> status confirmed); Strategy's
  Autopilot draft buttons posted to /api/campaigns without
  action:"create", 404'd and still showed a success message — fixed
  (verified: 3 drafts created).
- Verification: npx tsc --noEmit clean; npm run build clean; local
  throwaway-Postgres end-to-end with an owner + a second account — all
  three pages return 200 and their render expressions pass against the
  real API payloads; the exported pages' data flows (payments, donations,
  campaigns, owner boards) exercised with the owner's session; non-owner
  /api/owner and the donations board still return 403. Nothing was
  registered or written on production by this fix.

## Community Feed + shareTexts server-call fix (2026-11-09)
- NEW Community Feed (nav "Community · சமூகம்", page /app/community,
  API /api/community, migration 0010 + server-side self-init in
  src/lib/community.ts — no manual migration step needed):
  - A signed-in member publishes one of THEIR OWN saved creatives or one
    of THEIR OWN My Media videos (title required; caption optional;
    "Allow others to reuse this design" toggle, default OFF). Ownership
    is verified server-side against the caller's own rows — publishing
    another member's creative/media id is rejected (404); a non-video
    media item is rejected (400). Private media stays private until its
    owner publishes it.
  - Feed is newest-first: the design preview (DesignScene, with the
    creative's placed media playing) or the video itself, the poster's
    display name + Founder badge, and REAL like/share counts
    (COUNT(*) over community_likes / community_shares rows — no seeded
    or simulated engagement anywhere).
  - Like toggles, one per account, enforced by PRIMARY KEY
    (post_id, user_id) + delete-then-insert toggle logic.
  - Share records a real share row and returns EN+TA copy carrying the
    SHARER's OWN invite code/link (built from the request origin) —
    never the poster's code, never a shared code (per-person rule).
  - Reuse: only when the post's allow_reuse is true — "Use this design"
    opens the Studio with the creative's design loaded as a template
    (same sessionStorage pattern as the Design Library); video posts
    place the video in the Studio the same way My Media does. When
    false, the action is absent and an honest bilingual note says the
    owner hasn't allowed reuse. Post owners can remove their own posts
    (others get 403).
- FOUND FAULT, fixed in the same pass (class fix): GET /api/growth and
  GET /api/showcase returned 500 for every signed-in user —
  shareTexts() lived in src/lib/client.ts ("use client") and Next
  forbids calling a client-module function from a route handler
  ("Attempted to call shareTexts() from the server…"). The function now
  lives in server-safe src/lib/share.ts; client.ts re-exports it so
  client imports are unchanged, and both routes import from
  "@/lib/share". Verified end-to-end: both routes return 200 and the
  growth payload's inviteCode matches the caller's own code.
- Verification (local throwaway Postgres, production build, two real
  accounts — Reel-18 negative tests included): tsc clean; build clean;
  no-env smoke: / 200, /app/community 200, APIs honest 503
  SETUP_PENDING. Publish without a title -> 400 bilingual; publish
  another member's creative -> 404; publish another member's video ->
  404; publish an image media item -> 400; valid creative + video
  publishes -> 200 and render in the feed with poster Founder badge;
  like -> count 1, like again -> count 0 (toggle returns to original);
  share -> count 1 and the copy carries the sharer's code, not the
  poster's; signed-out like/publish/feed -> 401 with no raw errors;
  unpublish by non-owner -> 403, by owner -> 200. Overflow: the page
  reuses the fluid .wrap/.grid/.card classes (border-box global, grid
  minmax(280px,1fr), video width 100%) — checked at source level; no
  browser probe was available in the build sandbox. Nothing was
  registered or written on production by these tests.

## 2026-11-09 — Social Pack on the Community Feed (Phase 2)

- Comments, follows, saves, stories, in-app notifications, member
  profiles, search + hashtags, and post reports — method-level
  equivalents of the familiar social patterns, built on the app's own
  tables and words. Migration migrations/0011_social.sql (idempotent)
  + the same tables self-initialise in src/lib/community.ts, so no
  manual step is needed. New tables: community_comments,
  community_follows (PRIMARY KEY pair + CHECK follower <> followee),
  community_saves, community_stories, community_story_views,
  community_reports.
- Comments: signed-in members comment (empty comment -> bilingual
  400); the comment's author OR the post's owner can delete it, anyone
  else gets 403. Comment counts are COUNT(*) over real rows.
- Follow: toggle follow/unfollow (follow yourself -> bilingual 400;
  counts from real rows); feed gains All / Following / Saved views.
- Save: bookmark toggle; the Saved view lists only the caller's own
  saved posts.
- Notifications: like, comment, follow and share events create rows via
  the existing notify() helper for the other member (never for
  yourself); new /app/notifications page + nav tab, unread badge in
  the header now links there, mark-all-read. Labelled honestly on the
  page: in-app only — no email, no phone push is sent.
- Member profiles: /app/member?u=<id> shows display name, Founder
  badge, follower/following counts, follow button and the member's
  published posts. The profile API selects only id/name/founder_number
  — no email or phone is ever selected or sent (test asserted the
  payload has no email field).
- Stories: publish own creative/video as a story; expiry is enforced
  in SQL (created_at > now() - 24h) so an expired story is never
  returned; views are unique real rows (author's own opening not
  counted; a second view by the same member does not raise the count).
- Search + hashtags: search matches post titles/captions and member
  names; #hashtags are parsed from captions, returned in the payload,
  rendered tappable, and filter the feed by exact tag.
- Reports: any signed-in member can report a post (signed-out -> 401);
  reports land in Owner Control (new "reports" board); the owner can
  dismiss a report or remove the post (server-enforced owner-only —
  non-owner board access -> 403; removal cascades and is audited).
- FOUND FAULT, fixed in the same pass (class fix): user/post ids are
  BIGSERIAL, so Postgres returns them as strings. The follow
  self-check compared Number(userId) === user.id (string) and missed,
  letting the no-self CHECK constraint turn a self-follow into a 500;
  it now compares as numbers and returns the plain bilingual 400. The
  same class in the client (Number(p.user_id) === me.id, never true)
  broke the "Your post" badge/Remove button from Phase 1; the
  comparison is now string-to-string.
- Verification (local throwaway Postgres, production build, three real
  accounts, Reel-18 negative tests included): tsc clean; build clean;
  no-env smoke: /app/notifications 200, /app/member 200, API honest
  503 SETUP_PENDING. Empty comment -> 400 bilingual; comment by another
  member -> count 1 in feed; delete by unrelated member -> 403, by
  post owner -> 200, by author -> 200; like/comment/share/follow each
  produced a notification row for the post owner and mark-all-read
  cleared the unread count to 0; follow self -> 400; follow ->
  followerCount 1, profile followers 1, Following view shows the
  post, unfollow -> view empty; save -> Saved view shows post, unsave
  -> empty; story from another member's creative -> 404, own creative
  -> 200, two views by the same member -> count stays 1, story
  backdated to 25h -> absent from the list and view attempt -> 404;
  search by title finds the post, search by name finds the member,
  #TestTag finds the post, unknown tag -> none; report signed out ->
  401, report -> owner board lists it open, dismiss -> dismissed,
  owner remove -> post gone from the feed. Phase 1 spot-checks
  (no-title publish 400, other's creative 404) re-passed. Overflow:
  new pages reuse the fluid classes; the stories row scrolls
  horizontally by design inside its own strip; checked at source
  level (no browser probe in the sandbox). Nothing was registered or
  written on production by these tests.

## 2026-11-09 — Usability + Guidance wave (Phase 3)

- Owner's report: he could not understand how to use the app. This
  wave adds guidance everywhere and clearer arrangement — NO feature,
  data, price, claim or settled rule changed.
- "Start here" 5-step path (new shared component
  src/components/StartHere.tsx) on the landing page AND the signed-in
  home: 1 Create your free account -> 2 Pick a design -> 3 Add your
  words and photo -> 4 Export & share anywhere -> 5 Invite others with
  your own link and earn free days. Big 48px numbered circles, EN +
  Tamil, every button goes to the real page for that step (sign-up,
  Library, Studio, Studio's Export & Share, Growth). Signed-in members
  see step 1 ticked done. The landing hero also gained a "How to use"
  button.
- Full guide page /app/guide (new): one card per main area — Design
  Library & Studio, My Media, Export & Share, Community, Stores &
  Marketplace, Delivery Partners, Growth & Invite, Plans & Payments,
  Teams — plus a Notifications card and the Start here path on top.
  Each card has 3–5 short numbered steps in simple words, English AND
  Tamil shown together, and a button into the area. The guide renders
  signed out too (it is guidance, never hidden behind sign-in); the
  areas it points to ask for sign-in as before. A Guide tab was added
  to the app navigation.
- In-page help strip on every main page: AppShell now renders a
  collapsible strip at the top of <main>, keyed by pathname — "❓ How
  this page works · இந்தப் பக்கம் எப்படி வேலை செய்கிறது" with 3
  numbered steps specific to that page, in the visitor's chosen
  language. Collapsed by default; it never blocks the main action.
  Pages covered (24): Dashboard, Studio, Campaigns, Design Library,
  Showcase, Community, Notifications, Guide, Explore, Stores, My
  Store, My Orders, Delivery, Teams, Partners, Growth, Plans, My
  Media, Strategy, Member profile, Settings, Categories, Owner
  Control, Sign-in. (The landing page carries the full Start here path
  instead of a strip.)
- Empty states: every named empty state now has one plain "next step"
  line and a button to the right page — My Media (none), My Orders
  (buyer -> Stores, seller -> My Store), Studio creative library
  (none -> Design Library), Campaigns (none), Teams (no workspace),
  Delivery (none available), Community feed (all/following/saved),
  Notifications (none), member profile (no posts).
- Tap targets: .btn is now inline-flex with min-height 44px and the
  nav tabs are min-height 44px — same colours and identity, just
  easier to tap. No heavy libraries added; motion unchanged (light).
- FOUND FAULT, fixed in the same pass: the Growth page read the
  invite link from d.inviteLink but /api/growth returns it as `link`,
  so the plain invite-link line on the Growth page rendered EMPTY
  (the code and the share texts were correct). The page now reads
  d.link. Verified: the API's link carries the account's own code.
- Verification: tsc clean; production build clean (route list
  includes /app/guide). Sandbox walk on a throwaway Postgres with a
  fresh account — all 39 checks passed: landing shows Start here with
  all step texts + guide link; guide renders signed out with all 9
  area cards and Tamil step lines; the help strip is present in the
  server-rendered HTML of 15 checked pages; the 5-step walk — (1)
  sign-up ok, (2) Library page 200, (3) creative saved with words via
  the Studio's save path, (4) Studio page carries the Export & Share
  panel (the download itself is a browser action — ExportShare
  renders a real downloadable file in the browser; verified at source
  level), (5) Growth API returns the fresh account's OWN invite code
  and a link carrying that same code; Growth page 200. Overflow:
  Start here rows, guide cards and the strip all use the fluid
  .wrap/.card/.row classes with wrapping rows and min-widths below
  390px; checked at source level (no browser probe in the sandbox).
  Nothing was registered or written on production by these tests.

## 2026-11-10 — My Media upload FIX: client direct-to-Blob uploads

- FAULT (owner-reported on production, 2026-11-10): My Media showed
  "Upload failed" for a ~12.4 MB WhatsApp video. TWO root causes:
  (1) the page read the whole file as base64 and sent it as ONE JSON
  POST to /api/media — a ~12 MB video becomes a ~16 MB request body,
  which the Vercel serverless payload limit (~4.5 MB) kills before
  storage is ever reached; (2) the production Blob store connected
  first ("viralai-by-farfaz-blob") is PRIVATE, so the old
  access:"public" put() could never have succeeded at any size.
- FIX — the Vercel pattern for large files: the browser now uploads
  DIRECTLY to Blob storage with a short-lived client token; file bytes
  never pass through a serverless function.
  - NEW src/app/api/media/upload-token/route.ts — handleUpload from
    @vercel/blob/client. Token generation requires a signed-in user;
    the clientPayload is validated (kind in {image, logo, audio,
    video}, name present, rightsConfirmed === true) and the pathname
    must start with media/u<userId>/; allowedContentTypes image/*,
    audio/*, video/*; maximumSizeInBytes = the kind's cap from the
    existing limits (5/5/10/25 MB); tokenPayload carries
    {userId, kind, name}. Validation failures are plain bilingual
    sentences, never raw codes. The upload-completed callback (no
    session cookie — handleUpload verifies it) registers the row
    idempotently, taking real size/contentType from head().
  - NEW src/app/api/media/register/route.ts — after the direct upload,
    the page registers the file: signed-in only, rights required,
    pathname must be inside the caller's own folder (403 otherwise),
    the blob must really exist (head(), time-bounded at 8 s so a forged
    URL fails fast), real contentType/size come from Blob, the family
    auto-detect rules are applied (logo must be an image; mismatches
    corrected to the file's real family), the per-kind cap is enforced
    against the real size (413), insert is idempotent — returns
    {id, url, kind, kindCorrected} like the old POST.
  - Shared rules moved to NEW src/lib/media.ts (limits, familyOf,
    correctKind, validateUploadRequest, insertMediaRow) so all three
    routes enforce exactly the same rules.
  - Dedupe: migration 0012 adds a UNIQUE index on media(blob_url);
    the app also self-initialises it on first insert (same pattern as
    the community tables); both registration paths insert with
    ON CONFLICT DO NOTHING.
  - src/app/api/media/route.ts: the base64 POST is REMOVED (single
    upload path). GET unchanged. DELETE now also best-effort del()s
    the stored blob (failures ignored — the row is already gone).
  - Page (src/app/app/media/page.tsx): base64 FileReader flow replaced
    with upload() from @vercel/blob/client — pathname
    media/u<myUserId>/<timestamp>-<safe name>, access "public",
    clientPayload {kind, name, rightsConfirmed:true}, live percentage
    on the Upload button via onUploadProgress; then the register call.
    Look, bilingual copy, limits, rights checkbox and the
    kindCorrected note are unchanged.
- TOKEN RESOLUTION (same day, after the store check): production has
  TWO Blob stores — the private original (BLOB_READ_WRITE_TOKEN) and
  the PUBLIC media store "viralai-by-farfaz-media" connected under a
  distinct env prefix (MEDIA_BLOB_READ_WRITE_TOKEN). Every Blob call
  now resolves its token via blobToken() in src/lib/blob.ts:
  MEDIA_BLOB_READ_WRITE_TOKEN || BLOB_READ_WRITE_TOKEN. blobReady()
  checks the same resolved token; handleUpload receives it explicitly
  (its `token` option); head()/del()/put() pass it explicitly. Access
  stays "public" everywhere — blob_url remains directly playable.
- Verification (Reel-18 discipline): tsc clean; production build
  clean (routes /api/media, /api/media/register,
  /api/media/upload-token all present). No-env smoke: /, /app/media,
  /auth 200; both new endpoints honest 503 SETUP_PENDING, never 500.
  Throwaway Postgres 16 (migrations 0001–0012 all applied, DB dropped
  after) + production build + a real signed-up test account:
  signed-out token request -> 401; signed-out register -> 401;
  signed-in token request with rightsConfirmed missing -> 400
  bilingual; foreign pathname media/u999/... -> 400; unsupported kind
  -> 400; name missing -> 400; fully valid request with no Blob token
  -> 503 bilingual setup message; register foreign pathname -> 403;
  register rights missing -> 400; register valid shape, no token ->
  503. With a dummy token (plain BLOB_ and MEDIA_-only, both proven):
  fully valid token request -> 200 with a real signed clientToken
  (MEDIA_-only run: the issued token carries the MEDIA store id, so
  resolution is proven, and GET /api/media reports blobReady:true);
  register with a non-existent blob URL -> 400 bilingual not-found,
  ZERO rows inserted. Insert idempotency verified at SQL level with
  the exact statement insertMediaRow runs: first insert RETURNING id,
  duplicate insert RETURNING nothing, exactly one row.
  NOT verified (honestly): a real Blob round-trip (browser -> Blob ->
  callback/register -> playable URL) needs the production token and a
  browser; it cannot run in this sandbox. Production proof is the
  owner's retry of the same ~12.4 MB video after this deploys.

## Sound fix — placed videos are no longer mute-locked (2026-11-10)
- Owner proof + report: after the direct-to-Blob upload fix, his own
  ~12.4 MB video uploaded and was placed in a Studio design ("Your media
  is placed here ✓", Clean Starter 9:16) — but on playback there was NO
  SOUND AT ALL, anywhere. Class audit of EVERY video surface in the app
  (6 native <video> elements exist, total):
  1. DesignScene placed video (src/components/ui.tsx) — FAULT: rendered
     `autoPlay muted loop` with NO controls and NO unmute path. This one
     component is the player for Studio compose preview, Studio saved
     creatives, Design Library scenes, Community creative posts and
     creative stories, and Member-page creative posts — so the whole
     class was mute-locked by a single element.
  2. ExportShare — FAULT (rule 3): video export recorded
     canvas.captureStream(30) ONLY, and its source element was muted —
     the exported file had NO audio track at all.
  3. Already correct, unchanged: My Media list player, Community feed
     direct videos, Community story-viewer direct videos, Member-page
     direct videos — all native `controls`, no muted attribute or
     property anywhere (no JS in the app sets .muted), so they play
     WITH sound by default. Showcase has no real <video> at all
     (animated CSS scenes, self-labelled "not video files").
- The rule now enforced in code:
  (1) Autoplay previews START muted only because browsers require it —
      and every such video carries a visible sound toggle.
  (2) Deliberately opened players play WITH sound by default.
  (3) A video export INCLUDES the placed video's own audio track.
- Fix 1 — ui.tsx: new SceneVideo component inside DesignScene. The
  preview still starts muted (autoplay rule), now with a `.scene-sound`
  toggle button riding on the scene (globals.css: absolute top-right,
  z-index above the scene overlay, min-width/min-height 44px, bilingual
  visible label "🔇 Sound off / ஒலி இல்லை" ↔ "🔊 Sound on / ஒலி
  உள்ளது", bilingual title + aria-label, aria-pressed). The toggle
  drives the muted PROPERTY via ref (v.muted = !next) and calls play()
  on unmute — React's muted attribute alone only sets the initial
  default and does not reliably toggle live playback.
- Fix 2 — ExportShare.tsx exportVideo rewritten: an offscreen UNMUTED
  clone of the placed video (crossOrigin anonymous, volume 1) feeds
  BOTH the canvas frames and a WebAudio tap —
  createMediaElementSource(clone) -> createMediaStreamDestination —
  whose audio track is merged with the canvas video track into the
  single MediaStream handed to MediaRecorder:
  new MediaStream([...canvasStream.getVideoTracks(), audioTrack]).
  The graph is never connected to ctx.destination, so no sound comes
  out of the speakers during export; the AudioContext is created and
  resumed first, inside the click's call stack. The success note only
  claims "your video's own sound is included" when an audio track was
  actually captured; the explanatory copy now states the same honestly.
  Fallbacks preserved: no WebAudio / no audio track -> video-only
  export exactly as before. The hidden JSX element stays muted —
  it is a still-frame source for image exports only, never a player.
  File naming honesty unchanged (MP4 where the browser truly produces
  it, else WebM).
- Verification: npx tsc --noEmit clean; production build clean
  (all routes present incl. /app/studio, /app/community, /app/media).
  No-env smoke on the production build: /, /auth, /app/media,
  /app/community, /app/studio, /app/member, /app/library, /app/showcase
  all 200; /api/public honest 503 SETUP_PENDING; zero 500s in the
  server log. Source-level proof: final <video> inventory re-grepped
  (6 elements, states as above); SceneVideo toggle + ref-driven muted
  property present; ExportShare audio path read end to end
  (el.muted = false -> createMediaElementSource ->
  createMediaStreamDestination -> getAudioTracks()[0] merged into the
  recorded MediaStream).
  NOT verified (honestly): MediaRecorder/captureStream/WebAudio
  behaviour in a real browser cannot run in this sandbox. Production
  proof is the owner's phone retest: (a) Studio preview — tap
  "🔇 Sound off / ஒலி இல்லை" on the placed video and the video's own
  sound must play; (b) My Media / Community players already play with
  sound via their native controls; (c) Export video — the downloaded
  file must play WITH the video's own sound.
