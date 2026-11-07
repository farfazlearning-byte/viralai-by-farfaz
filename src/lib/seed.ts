import { q, q1 } from "./db";
import { PARTNERS } from "./partners";
import { HOUSE_ADS } from "./houseAds";
import { COUNTRIES } from "./registry";
import { SHOWCASE_DESIGNS } from "./showcaseDesigns";

let seeded: Promise<void> | null = null;

/** Code-driven, idempotent seeding from the TS data definitions:
 *  14 partners, 17 house ads, the country payment registry, showcase design
 *  state. Runs once per process; guarded by the settings 'seeds' marker so a
 *  fresh database is populated on first use. */
export function ensureSeeds(): Promise<void> {
  if (!seeded) seeded = runSeeds().catch(() => {
    seeded = null;
  });
  return seeded;
}

async function runSeeds(): Promise<void> {
  const marker = await q1<{ value: { v1?: boolean } }>(`SELECT value FROM settings WHERE key = 'seeds'`);
  for (const p of PARTNERS) {
    await q(
      `INSERT INTO partners (key, name, category, how_money_flows_en, how_money_flows_ta, owner_step_en, owner_step_ta, typical_terms_en, typical_terms_ta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (key) DO NOTHING`,
      [p.key, p.name, p.category, p.howEn, p.howTa, p.ownerStepEn, p.ownerStepTa, p.termsEn, p.termsTa],
    );
  }
  for (const ad of HOUSE_ADS) {
    const badge = /DEMO/.test(ad.labelEn) ? "DEMO" : /PROPOSAL/.test(ad.labelEn) ? "PROPOSAL" : "LIVE";
    await q(
      `INSERT INTO house_ads (slug, title_en, title_ta, body_en, body_ta, badge, how_made_en, how_made_ta, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (slug) DO NOTHING`,
      [ad.key, ad.titleEn, ad.titleTa, ad.bodyEn, ad.bodyTa, badge, ad.madeHowEn, ad.madeHowTa, ad.sort],
    );
  }
  for (const c of COUNTRIES) {
    const isIndia = c.code === "IN";
    await q(
      `INSERT INTO country_payments (country, currency, route, status, join_open)
       VALUES ($1,$2,$3,$4,true) ON CONFLICT (country) DO NOTHING`,
      [c.en, c.currency, isIndia ? "upi_qr" : "wire", isIndia ? "live" : "details_pending"],
    );
  }
  for (const d of SHOWCASE_DESIGNS) {
    await q(
      `INSERT INTO showcase_design_state (design_key, enabled, sort) VALUES ($1, true, $2) ON CONFLICT (design_key) DO NOTHING`,
      [d.key, d.sort],
    );
  }
  if (!marker?.value?.v1) {
    await q(
      `INSERT INTO settings (key, value, updated_at) VALUES ('seeds', '{"v1": true}'::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    );
  }
}
