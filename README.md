# ViralAI by FARFAZ — Public Edition

The public, self-hosted edition of **ViralAI by FARFAZ** — an ad-intelligence
platform for local businesses worldwide: ad studio, a generated design library,
stores & marketplace, delivery partners, team workspaces, partners & earnings,
growth/referral, and an owner control centre. Bilingual UI: **English + தமிழ்**.

Honesty labels used everywhere in the product:

- **SIMULATED** — dashboard reach/click/ROAS-style figures are illustrative
  simulations, always badged as such.
- **REGISTERED** — Meta / Google / WhatsApp APIs and partner programmes are
  registered, **not connected**. No real ads are published and no real money is
  spent by the app. Autopilot never publishes, spends or charges.
- **LIVE / real** — accounts, campaigns, orders, payments-pending-approval,
  donations and counters are real rows in your own database.

Money always flows **directly** between people (buyer → store, member → owner's
own UPI/wire). The platform never holds order or plan money.

---

## Stack

- **Next.js 16 (App Router, TypeScript)** on Vercel
- **Neon Postgres** via the `pg` driver and a small typed query helper
  (`src/lib/db.ts`) — no ORM, deliberately simple and reliable
- **Vercel Blob** for member media uploads (`src/lib/blob.ts`), with a
  documented swap point for Cloudinary / Cloudflare R2
- Plain CSS (cyber-luxe theme), no CSS framework — kept light

## Repository layout

| Path | What |
| --- | --- |
| `migrations/0001…0007_*.sql` | Numbered SQL migrations — **all** tables, in order |
| `src/lib/` | Data layer, auth, positions/tiers, categories (48), country registry, design generator, house ads (17), partners (14), showcase designs (11), QR, seeds |
| `src/app/api/` | 20 API route groups (auth, campaigns, stores, orders, delivery, teams, partners, payments, donations, owner, …) |
| `src/app/` | Landing, auth, member app (16 tabs), owner control |
| `public/` | PWA manifest + install icons (SVG source + generated 192 / 512 maskable / apple-touch PNGs via `scripts/generate-icons.mjs`) |
| `.env.example` | Every required variable — **no real values** |

The Design Library is **generated data**: designs are produced programmatically
from family × kind × size × theme (26 families — 20 premium + 6 free starters —
10 kinds, 4 sizes, 2 themes = 2,080 designs). Every count shown in the app is
computed from the data, never a hard-coded claim. Premium designs can be
previewed by everyone; saving/attaching one requires an active Premium position
(free days or paid), enforced on the server.

---

## Setup — Stages 2–4 (Stage 1, the GitHub repo, is already done)

> ⚠️ **Secrets rule:** connection strings and secrets are pasted **only** into
> the Vercel Environment Variables screen (or the Neon/Vercel consoles). Never
> paste them into chat, email, or any file in this repo.

### Stage 2 — Create the Neon database (owner)

1. Go to **https://neon.tech** → Sign in **with GitHub**.
2. Create a project (any name, e.g. `viralai`), region close to your users.
3. Run the migrations: open the project's **SQL Editor** and paste/run each
   file in `migrations/` **in number order** (`0001` → `0007`). Each file is
   idempotent (`IF NOT EXISTS` / `ON CONFLICT`), so re-running is safe.
   - Alternative: from a computer with `psql`:
     `for f in migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done`
4. In Neon → **Connection Details**, copy the **pooled** connection string
   (it looks like `postgres://…@…pooler…/…?sslmode=require`). Keep it for
   Stage 3 — paste it only into Vercel.

> The app also self-seeds reference data (partners, house ads, country payment
> rows, showcase states) on first use, and the payment settings row ships with
> the owner's India UPI receiving address pre-filled (owner-editable in Owner
> Control → Payments). All other payment details start **empty**.

### Stage 3 — Import into Vercel and deploy (owner clicks, Muse supplies settings)

1. Go to **https://vercel.com/new** → sign in with GitHub → **Import** the
   `viralai-by-farfaz` repository.
2. Framework preset: **Next.js** (auto-detected). Build command and output:
   defaults — do not change. (`vercel.json` in the repo only pins the framework.)
3. **Environment Variables** — add exactly these three (Production):
   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the Neon pooled connection string from Stage 2 |
   | `SESSION_SECRET` | a long random string (32+ chars), e.g. generated with `openssl rand -hex 32` |
   | `BLOB_READ_WRITE_TOKEN` | from Vercel → Storage → **Create Blob store** → connect it to this project (Vercel fills this in automatically when you connect the store) |
4. Click **Deploy**. When it finishes, open the `*.vercel.app` address and
   check: the landing page loads, and **the owner registers the FIRST account**
   — the first account created becomes **Owner + Founder #1** automatically.
   (This public site starts with a fresh database: existing accounts on any
   other copy do not carry over.)
5. Without `BLOB_READ_WRITE_TOKEN`, media uploads pause with an honest message;
   everything else works.

### Stage 4 — Attach the domain `agentworkshoptamil.com` (owner)

1. Vercel → the project → **Settings → Domains** → add `agentworkshoptamil.com`
   and `www.agentworkshoptamil.com`.
2. Vercel will show the exact DNS records it needs. At **Porkbun** (the domain
   registrar) → DNS management for the domain, enter **exactly the records
   Vercel displays** (typically an `A` record for `@` and a `CNAME` for `www`
   pointing at Vercel — copy the values from Vercel's screen, never from memory).
3. Wait for Vercel to show the domain as **Valid** with HTTPS on (usually
   minutes). Invite links then work everywhere as
   `https://agentworkshoptamil.com/?ref=<code>`.

### Stage 5 — Go-live checks

- Signed-out visit: landing loads, `?ref=` shows the invited banner, sign-up
  pre-fills the invite code.
- Owner signs in → Owner Control → **Payments**: set the Monthly/Yearly prices
  (they start unset — "Price set by owner soon"), confirm the India UPI address,
  and (for Canada/world) fill the wire fields yourself when ready — they start
  empty and the pay panel honestly says so until then.
- Health Board (Owner Control) shows database + storage status from real checks.

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your own Neon dev-branch values
npm run dev                  # http://localhost:3000
npm run build                # production build (works with no DB configured:
                             #  runtime routes answer 503 SETUP_PENDING instead of crashing)
```

## Caveats (from the deployment plan)

- Vercel Hobby is for personal/non-commercial use with ~100 GB bandwidth/month;
  plan on **Pro (~$20/mo)** from first revenue.
- Neon free tier ≈ 0.5 GB and scales to zero (no week-long pause like some
  free tiers); media never goes in the database — Blob only.
- Two homes during transition: this public edition has its **own fresh
  database**; accounts from the Muse-hosted copy do not migrate.
- Cold starts can make the first request after idle slower.

See **BUILD-LOG.md** for stack choices and the verification record.
