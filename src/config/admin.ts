// TEMPORARY: this secret ships in the browser bundle, so it protects nothing.
// Kept as-is (moved here from Admin.tsx) until admin auth is replaced with a
// verified Supabase session + admin allowlist — the single place to change.
// VITE_ADMIN_SECRET lets a local dev server match backend/.env; it is bundled
// just the same, so it is no more secret than the hard-coded fallback.
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'powerparent-admin-2026';

export function adminHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET };
}
