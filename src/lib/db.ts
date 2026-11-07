import { Pool } from "pg";

// Server-side data layer. Choice: the `pg` driver with a small typed query
// helper — simpler and more reliable for this app than an ORM, and it works
// unchanged against Neon Postgres (DATABASE_URL) on Vercel.
let pool: Pool | null = null;

export function dbReady(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function q<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query(sql, params as unknown[]);
  return res.rows as T[];
}

export async function q1<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows.length ? rows[0] : null;
}

/** Run a function inside a transaction. */
export async function tx<T>(fn: (client: {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
}) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn({
      query: async (sql, params = []) => {
        const r = await client.query(sql, params as unknown[]);
        return { rows: r.rows as unknown[] };
      },
    });
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/** Log an operational error into the Error Inbox (best-effort; never throws). */
export async function logError(source: string, message: string, detail = ""): Promise<void> {
  try {
    if (!dbReady()) return;
    await q(`INSERT INTO error_log (source, message, detail) VALUES ($1,$2,$3)`, [
      source.slice(0, 80),
      message.slice(0, 500),
      detail.slice(0, 2000),
    ]);
  } catch {
    /* the error inbox must never break the request path */
  }
}
