# Scraggy Airlines

**FLY SOMEWHERE EVENTUALLY.** A funny parody airline website: Mdm Wrong-Wrong quotes on every page, Scraggy Points with pants tiers, a joke booking form, an airport guide with a magic gate, and a live clock.

Plain HTML, CSS and JavaScript. No build step. See [`DEVELOPMENT.md`](DEVELOPMENT.md) for the full plan.

## Run it locally

Browsers block JavaScript modules on `file://`, so use a tiny local server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on GitHub Pages

1. Push this repo to GitHub (branch `main`).
2. In the repo, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, then **Save**.
4. After about a minute the site is live at `https://<your-username>.github.io/Scraggy-airlines/`.

Every push to `main` redeploys automatically. All links are relative, so the site works under the `/Scraggy-airlines/` path.

## Scraggy Points accounts

The site has two modes:

| Mode | When | What it means |
|------|------|---------------|
| **Demo mode** (default) | `js/config.js` has no Supabase keys | Accounts and points are saved **in that one browser only**. Fine for trying it out. |
| **Real accounts** | Supabase keys are set | Sign up once and log in on **any device**. |

GitHub Pages can only serve static files, so accounts on every device need a small free backend. To turn it on:

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. **Authentication → Sign In / Providers → Email**: turn **off** "Confirm email" (usernames become hidden fake emails that cannot receive mail).
4. **Authentication → URL Configuration**: set the Site URL to your GitHub Pages address.
5. **Project Settings → API**: copy the **Project URL** and the **anon public** key into `js/config.js`:

   ```js
   SUPABASE_URL: "https://xxxx.supabase.co",
   SUPABASE_ANON_KEY: "eyJ...",
   ```

6. Commit and push.

The anon key is designed to be public. Row Level Security (in the schema) makes each user able to read only their own data, and points can only change through the database functions. **Never put the `service_role` key in this repo.**

## Scraggy image

The site looks for `assets/scraggy.png` (used in the logo and on the home page). Until you add one, it shows a generic placeholder mascot. See [`CREDITS.md`](CREDITS.md) for how to add your image with proper credit.

## Files

```
index.html  destinations.html  book.html  airport.html  baggage.html
inflight.html  crew.html  fleet.html  about.html  points.html
redeem.html  login.html  404.html
css/styles.css
js/           main.js (header, footer, quote, clock)  data.js (rules)
              backend*.js (demo + Supabase)  book.js  airport.js ...
supabase/schema.sql
```
