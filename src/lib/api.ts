import { NextResponse } from "next/server";
import { dbReady, logError } from "./db";

/** Wrap an API handler: consistent JSON errors, honest DB-setup state. */
export function handler<T extends unknown[]>(
  fn: (...args: T) => Promise<Response>,
): (...args: T) => Promise<Response> {
  return async (...args: T) => {
    try {
      if (!dbReady()) {
        return NextResponse.json(
          { ok: false, error: "SETUP_PENDING", message: "Database is being set up." },
          { status: 503 },
        );
      }
      return await fn(...args);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "UNAUTHORIZED") return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
      if (msg === "OWNER_ONLY") return NextResponse.json({ ok: false, error: "OWNER_ONLY" }, { status: 403 });
      await logError("api", msg);
      return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: msg.slice(0, 200) }, { status: 500 });
    }
  };
}

export function ok(data: Record<string, unknown> = {}): Response {
  return NextResponse.json({ ok: true, ...data });
}

export function bad(message: string, status = 400): Response {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const j = (await req.json()) as unknown;
    return typeof j === "object" && j !== null ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function str(v: unknown, max = 500): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}
