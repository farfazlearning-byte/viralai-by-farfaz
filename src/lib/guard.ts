import { q, q1 } from "./db";

interface PlatformSettings {
  killSwitch?: boolean;
  platformFeePercent?: number;
}

export async function platformSettings(): Promise<PlatformSettings> {
  const r = await q1<{ value: PlatformSettings }>(`SELECT value FROM settings WHERE key = 'platform'`);
  return r?.value ?? {};
}

export async function setPlatformSettings(patch: PlatformSettings): Promise<void> {
  const cur = await platformSettings();
  await q(
    `INSERT INTO settings (key, value, updated_at) VALUES ('platform', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify({ ...cur, ...patch })],
  );
}

export async function userSetting(userId: number, key: string): Promise<string> {
  const r = await q1<{ value: string }>(
    `SELECT value FROM user_settings WHERE user_id = $1 AND key = $2`,
    [userId, key],
  );
  return r?.value ?? "";
}

export async function setUserSetting(userId: number, key: string, value: string): Promise<void> {
  await q(
    `INSERT INTO user_settings (user_id, key, value, updated_at) VALUES ($1,$2,$3, now())
     ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [userId, key, value],
  );
}

/** Kill Switch enforcement for campaign activation — checked server-side
 *  before any campaign may become active. Nobody bypasses this. */
export async function activationBlockReason(userId: number): Promise<string | null> {
  const platform = await platformSettings();
  if (platform.killSwitch) {
    return "The Kill Switch is ON — all campaigns are paused platform-wide. / Kill Switch ON — எல்லா பிரச்சாரங்களும் நிறுத்தப்பட்டுள்ளன.";
  }
  const own = await userSetting(userId, "kill_switch");
  if (own === "on") {
    return "Your own Kill Switch is ON. / உங்கள் சொந்த Kill Switch ON-இல் உள்ளது.";
  }
  return null;
}
