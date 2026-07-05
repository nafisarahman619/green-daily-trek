import { supabase } from "@/integrations/supabase/client";

const BUCKET = "profile-pictures";
const cache = new Map<string, { url: string; exp: number }>();
const EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days

/**
 * A stored avatar_url may be either:
 *  - a storage path inside the profile-pictures bucket (preferred)
 *  - an absolute http(s) URL (external)
 * Returns a browser-usable URL or null.
 */
export async function signAvatarUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const now = Date.now();
  const hit = cache.get(pathOrUrl);
  if (hit && hit.exp > now) return hit.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pathOrUrl, EXPIRES_IN);
  if (error || !data?.signedUrl) return null;
  cache.set(pathOrUrl, { url: data.signedUrl, exp: now + (EXPIRES_IN - 60) * 1000 });
  return data.signedUrl;
}

export async function signAvatarUrls(paths: (string | null | undefined)[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const toSign: string[] = [];
  const now = Date.now();
  for (const p of paths) {
    if (!p) continue;
    if (/^https?:\/\//i.test(p)) {
      out.set(p, p);
      continue;
    }
    const hit = cache.get(p);
    if (hit && hit.exp > now) {
      out.set(p, hit.url);
    } else {
      toSign.push(p);
    }
  }
  if (toSign.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(toSign, EXPIRES_IN);
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) {
        out.set(row.path, row.signedUrl);
        cache.set(row.path, { url: row.signedUrl, exp: now + (EXPIRES_IN - 60) * 1000 });
      }
    }
  }
  return out;
}

export const AVATAR_BUCKET = BUCKET;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPT = ["image/jpeg", "image/png", "image/webp"];
