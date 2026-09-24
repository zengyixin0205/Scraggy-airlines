// Real accounts that work on any device, using Supabase (see README.md and supabase/schema.sql).
// The browser only READS its own rows. Points change only through database functions (RPC),
// so nobody can give themselves points from the browser console.
import { REWARDS, SECRET_CODE, WELCOME_BONUS, err, placeName, validateCredentials } from "./data.js";

const KNOWN_CODES = [
  "sia_rule", "bad_route", "bad_class", "bad_aircraft", "bad_date", "daily_limit", "not_logged_in",
  "not_enough_points", "already_redeemed", "bad_reward", "note_required", "already_claimed", "bad_code"
];

function rpcError(error) {
  const msg = String((error && error.message) || "");
  const code = KNOWN_CODES.find((c) => msg.includes(c));
  return err(code || "network", msg);
}

export function create(cfg) {
  let clientPromise = null;
  const client = () => {
    if (!clientPromise) {
      clientPromise = import("https://esm.sh/@supabase/supabase-js@2").then((m) =>
        m.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
      );
    }
    return clientPromise;
  };
  const emailFor = (username) => `${username.trim().toLowerCase()}@${cfg.EMAIL_DOMAIN}`;

  async function getUser() {
    const sb = await client();
    const { data } = await sb.auth.getSession();
    const user = data && data.session && data.session.user;
    if (!user) return null;
    return { username: (user.user_metadata && user.user_metadata.username) || "traveller" };
  }

  async function signUp(username, password) {
    validateCredentials(username, password);
    const sb = await client();
    const { data, error } = await sb.auth.signUp({
      email: emailFor(username),
      password,
      options: { data: { username: username.trim() } }
    });
    if (error) {
      if (/already|registered|exists|database error/i.test(error.message)) throw err("username_taken");
      if (/password/i.test(error.message)) throw err("bad_password");
      throw err("network", error.message);
    }
    // Email confirmation must be OFF in Supabase, or there will be no session yet.
    if (!data.session) {
      const res = await sb.auth.signInWithPassword({ email: emailFor(username), password });
      if (res.error) throw err("network", "Sign-up worked but no session was created. Turn off email confirmation in Supabase.");
    }
  }

  async function logIn(username, password) {
    const sb = await client();
    const { error } = await sb.auth.signInWithPassword({ email: emailFor(username), password });
    if (error) throw err("bad_login");
  }

  async function logOut() {
    const sb = await client();
    await sb.auth.signOut();
  }

  async function getProfile() {
    const sb = await client();
    const { data: session } = await sb.auth.getSession();
    if (!session.session) throw err("not_logged_in");
    const [p, b, r, s] = await Promise.all([
      sb.from("profiles").select("username, points, lifetime_points, created_at").single(),
      sb.from("bookings").select("booking_ref, flight_no, origin, destination, points_earned, created_at").order("created_at", { ascending: false }).limit(50),
      sb.from("redemptions").select("reward_id, cost, note, created_at").order("created_at", { ascending: false }).limit(50),
      sb.from("secret_finds").select("code, created_at")
    ]);
    if (p.error) throw err("network", p.error.message);

    const ledger = [
      { type: "bonus", t: p.data.created_at, label: "Welcome bonus", delta: WELCOME_BONUS },
      ...(b.data || []).map((x) => ({
        type: "booking",
        t: x.created_at,
        label: `${x.flight_no} ${placeName(x.origin)} to ${placeName(x.destination)} (${x.booking_ref})`,
        delta: x.points_earned
      })),
      ...(r.data || []).map((x) => {
        const reward = REWARDS.find((w) => w.id === x.reward_id);
        return { type: "redeem", t: x.created_at, label: `Redeemed: ${reward ? reward.name : x.reward_id}`, delta: -x.cost };
      }),
      ...(s.data || []).map((x) => ({ type: "bonus", t: x.created_at, label: "Found Gate 9¾", delta: 500 }))
    ].sort((a, c) => (a.t < c.t ? 1 : -1));

    return {
      username: p.data.username,
      points: p.data.points,
      lifetime: p.data.lifetime_points,
      ledger,
      redemptions: (r.data || []).map((x) => ({ id: x.reward_id, note: x.note, t: x.created_at }))
    };
  }

  async function bookFlight(trip) {
    const sb = await client();
    const { data, error } = await sb.rpc("book_flight", {
      p_origin: trip.origin,
      p_destination: trip.destination,
      p_return: !!trip.isReturn,
      p_class: trip.travelClass,
      p_aircraft: trip.aircraft || "surprise",
      p_seat: trip.seat || "somewhere",
      p_date: trip.date,
      p_return_date: trip.isReturn ? trip.returnDate : null
    });
    if (error) throw rpcError(error);
    return data;
  }

  async function redeem(rewardId, note) {
    const sb = await client();
    const { data, error } = await sb.rpc("redeem_reward", { p_reward_id: rewardId, p_note: note || null });
    if (error) throw rpcError(error);
    return data;
  }

  async function claimSecret(code) {
    const sb = await client();
    const { data, error } = await sb.rpc("claim_secret", { p_code: code || SECRET_CODE });
    if (error) throw rpcError(error);
    return data;
  }

  return { getUser, signUp, logIn, logOut, getProfile, bookFlight, redeem, claimSecret };
}
