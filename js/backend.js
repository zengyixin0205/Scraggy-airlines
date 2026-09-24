// Picks the account/points backend:
//  - Supabase (real accounts that work on any device) when config.js has keys,
//  - otherwise DEMO MODE, which stores everything in this browser only.
import { CONFIG } from "./config.js";

export function isDemo() {
  return !(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
}

let implPromise = null;

export function backend() {
  if (!implPromise) {
    implPromise = isDemo()
      ? import("./backend-local.js")
      : import("./backend-supabase.js").then((m) => m.create(CONFIG));
  }
  return implPromise;
}
