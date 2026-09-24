// Site settings. Only PUBLIC values belong here (never a service_role key).
//
// Accounts on any device need a Supabase project (see README.md).
// While SUPABASE_URL / SUPABASE_ANON_KEY are empty the site runs in DEMO MODE:
// accounts and points are saved in this browser only.
export const CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Usernames are turned into a hidden email like scraggy_fan@scraggyairlines.invalid
  EMAIL_DOMAIN: "scraggyairlines.invalid",

  // Time zone shown as "SIA time" on the live clock.
  SIA_TIMEZONE: "Asia/Singapore",

  // Mdm Wrong-Wrong's clock is always this many minutes wrong.
  WRONG_MINUTES: 7
};
