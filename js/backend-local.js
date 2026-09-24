// DEMO MODE backend: accounts and points live in this browser only (localStorage).
// Good for trying the site out. For accounts that work on any device, use Supabase.
import {
  AIRCRAFT,
  CLASSES,
  DAILY_LEG_LIMIT,
  REWARDS,
  SECRET_BONUS,
  SECRET_CODE,
  WELCOME_BONUS,
  bookingRef,
  err,
  legPoints,
  placeName,
  planLegs,
  validateCredentials
} from "./data.js";

const USERS_KEY = "scraggy.demo.users";
const SESSION_KEY = "scraggy.demo.session";
const mem = { users: {}, session: null };

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return mem.users;
  }
}
function writeUsers(users) {
  mem.users = users;
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* storage blocked: keep in memory for this page only */
  }
}
function readSession() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return mem.session;
  }
}
function writeSession(name) {
  mem.session = name;
  try {
    if (name) localStorage.setItem(SESSION_KEY, name);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function toB64(bytes) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}
function fromB64(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
async function hashPassword(password, saltB64) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromB64(saltB64), iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return toB64(new Uint8Array(bits));
}

function currentUser() {
  const name = readSession();
  if (!name) return null;
  const users = readUsers();
  const u = users[name.toLowerCase()];
  return u ? { users, u } : null;
}

function requireUser() {
  const cur = currentUser();
  if (!cur) throw err("not_logged_in");
  return cur;
}

const nowIso = () => new Date().toISOString();

export async function getUser() {
  const cur = currentUser();
  return cur ? { username: cur.u.username } : null;
}

export async function signUp(username, password) {
  validateCredentials(username, password);
  const name = username.trim();
  const users = readUsers();
  if (users[name.toLowerCase()]) throw err("username_taken");
  const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
  users[name.toLowerCase()] = {
    username: name,
    salt,
    hash: await hashPassword(password, salt),
    points: WELCOME_BONUS,
    lifetime: WELCOME_BONUS,
    ledger: [{ type: "bonus", t: nowIso(), label: "Welcome bonus", delta: WELCOME_BONUS }],
    redemptions: [],
    finds: []
  };
  writeUsers(users);
  writeSession(name);
}

export async function logIn(username, password) {
  const users = readUsers();
  const u = users[String(username || "").trim().toLowerCase()];
  if (!u) throw err("bad_login");
  if ((await hashPassword(password, u.salt)) !== u.hash) throw err("bad_login");
  writeSession(u.username);
}

export async function logOut() {
  writeSession(null);
}

export async function getProfile() {
  const { u } = requireUser();
  return {
    username: u.username,
    points: u.points,
    lifetime: u.lifetime,
    ledger: [...u.ledger].sort((a, b) => (a.t < b.t ? 1 : -1)),
    redemptions: u.redemptions
  };
}

export async function bookFlight(trip) {
  const { users, u } = requireUser();
  const legs = planLegs(trip.origin, trip.destination, !!trip.isReturn);
  if (!CLASSES.some((c) => c.id === trip.travelClass)) throw err("bad_class");
  const dateOk = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "");
  if (!dateOk(trip.date) || (legs.length === 2 && !dateOk(trip.returnDate))) throw err("bad_date");
  if (legs.length === 2 && trip.returnDate < trip.date) throw err("bad_date");

  let aircraft = trip.aircraft;
  if (!aircraft || aircraft === "surprise") aircraft = AIRCRAFT[Math.floor(Math.random() * AIRCRAFT.length)].id;
  if (!AIRCRAFT.some((a) => a.id === aircraft)) throw err("bad_aircraft");

  const today = nowIso().slice(0, 10);
  const flownToday = u.ledger.filter((l) => l.type === "booking" && l.t.slice(0, 10) === today).length;
  if (flownToday + legs.length > DAILY_LEG_LIMIT) throw err("daily_limit");

  const ref = bookingRef();
  let total = 0;
  const out = legs.map((leg, i) => {
    const points = legPoints(leg.dest, trip.travelClass);
    total += points;
    u.ledger.push({
      type: "booking",
      t: nowIso(),
      label: `${leg.flightNo} ${placeName(leg.origin)} to ${placeName(leg.destination)} (${ref})`,
      delta: points
    });
    return {
      ...leg,
      ref,
      points,
      date: i === 0 ? trip.date : trip.returnDate,
      aircraft,
      travelClass: trip.travelClass,
      seat: trip.seat || "somewhere"
    };
  });
  u.points += total;
  u.lifetime += total;
  writeUsers(users);
  return { ref, legs: out, total, points: u.points, lifetime: u.lifetime };
}

export async function redeem(rewardId, note) {
  const { users, u } = requireUser();
  const r = REWARDS.find((x) => x.id === rewardId);
  if (!r) throw err("bad_reward");
  if (r.once && u.redemptions.some((x) => x.id === r.id)) throw err("already_redeemed");
  if (u.points < r.cost) throw err("not_enough_points");
  const cleanNote = String(note || "").trim().slice(0, 30);
  if (r.needsNote && !cleanNote) throw err("note_required");
  u.points -= r.cost;
  u.redemptions.push({ id: r.id, note: r.needsNote ? cleanNote : null, t: nowIso() });
  u.ledger.push({ type: "redeem", t: nowIso(), label: `Redeemed: ${r.name}`, delta: -r.cost });
  writeUsers(users);
  return { points: u.points, lifetime: u.lifetime };
}

export async function claimSecret(code) {
  const { users, u } = requireUser();
  if (code !== SECRET_CODE) throw err("bad_code");
  if (u.finds.includes(code)) throw err("already_claimed");
  u.finds.push(code);
  u.points += SECRET_BONUS;
  u.lifetime += SECRET_BONUS;
  u.ledger.push({ type: "bonus", t: nowIso(), label: "Found Gate 9¾", delta: SECRET_BONUS });
  writeUsers(users);
  return { points: u.points, lifetime: u.lifetime };
}
