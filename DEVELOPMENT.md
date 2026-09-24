# Scraggy Airlines: Development Plan

> Slogan: **FLY SOMEWHERE EVENTUALLY**
> A deliberately terrible, very funny airline website, hosted on GitHub Pages.

---

## 1. Overview

Scraggy Airlines is a joke airline site. Every page has a Scraggy-themed headline, a quote from **Mdm Wrong Wrong**, and jokes about how bad the airline is. Visitors can create a **Scraggy Points** account and log in from any device.

### Core requirements

| # | Requirement |
|---|-------------|
| 1 | Funny site about Scraggy Airlines |
| 2 | **Mdm Wrong Wrong** gives a quote on **every page** |
| 3 | Destinations: **Scraggy House**, **Mdm Wrong Wrong's**, **Lujin's** |
| 4 | **Scraggy Points**: sign up with username and password, log in on any device |
| 5 | Logo: a Scraggy sitting beside the words "Scraggy Airlines" |
| 6 | Big headline on each page (see section 3) |
| 7 | Scraggy In-Flight Service page and Crew page, in the same tone |
| 8 | Fleet: Airbus 777, Boeing 330, Airbus 747, Boeing 380 |
| 9 | CEO is **Scraggy** |
| 10 | Deployed to GitHub |
| 11 | Scraggy Points **tiers**: Bronze Pants, Gold Pants, Platinum Pants, Scraggy Pants (based on lifetime points) |
| 12 | Earn points by **booking flights**; **redeem** points for rewards |
| 13 | **Airport Guide** headed "LOST? WE WILL MAKE YOU MORE LOST", gates from SCG001, plus a magic-only **Gate 9¾** |
| 14 | **Fake booking form** for every flight |
| 15 | **Every flight starts or ends at Scraggy International Airport (SIA)** |
| 16 | Mdm Wrong-Wrong's own quotes used on the pages |

---

## 2. Important technical decision: accounts on GitHub Pages

GitHub Pages only serves **static files**. It has no server or database. A login that works on **any device** needs somewhere to store accounts, so the site needs a small free backend.

| Option | Cost | Notes |
|--------|------|-------|
| **Supabase** (recommended) | Free tier | Auth and a Postgres table for points. Safe to call from the browser. |
| Firebase Auth + Firestore | Free tier | Also works well. |
| localStorage only | Free | **Does not meet the requirement.** Accounts would exist only in one browser. Fine for a first prototype, though. |

**Plan:** use Supabase Auth.

- Supabase logs in with email, but we want **username + password**. The site turns the username into a fake email, e.g. `scraggy_fan` becomes `scraggy_fan@scraggyairlines.invalid`, and users never see it.
- Passwords are hashed by Supabase. **Never store passwords ourselves.**
- Supabase's public "anon" key is designed to be in browser code. It is safe **only if Row Level Security (RLS) is on** (see section 7). Never commit the `service_role` key.
- Turn **off** email confirmation in Supabase, since fake emails can't receive mail.

---

## 3. Site map and copy

Every page has: the header (logo and nav), a big headline, the page content, a **Mdm Wrong Wrong quote box**, and a footer.

| Page | File | Headline |
|------|------|----------|
| Home | `index.html` | **FLY SOMEWHERE EVENTUALLY** |
| Destinations | `destinations.html` | **GO SOMEWHERE (MAYBE THIS ONE)** |
| Baggage | `baggage.html` | **YOUR BAGS. OUR MYSTERY.** |
| In-Flight Service | `inflight.html` | **SNACKS ARE A STATE OF MIND** |
| Crew | `crew.html` | **MEET THE CREW (THEY MET US FIRST)** |
| Fleet | `fleet.html` | **OUR PLANES EXIST. PROBABLY.** |
| About / CEO | `about.html` | **OUR CEO IS SCRAGGY.** |
| Book a Flight | `book.html` | **BOOK A FLIGHT (WE WILL TRY)** |
| Airport Guide | `airport.html` | **LOST? WE WILL MAKE YOU MORE LOST** |
| Scraggy Points | `points.html` | **COLLECT POINTS. WEAR THE PANTS.** |
| Redeem | `redeem.html` | **SPEND YOUR POINTS ON SOMETHING** |
| Login / Sign up | `login.html` | **WHO ARE YOU (AGAIN)?** |
| 404 | `404.html` | **THIS PAGE HAS BEEN DELAYED** |

The headlines for Home and Baggage are fixed by the brief. The others are suggestions to edit.

### Page notes

- **Home:** headline, a "Book a flight (no promises)" button, a Scraggy mascot image, and a few silly stats ("0% on-time since 2019").
- **Destinations:** three cards.
  - **Scraggy House:** "Home base. Snacks not included."
  - **Mdm Wrong Wrong's:** "Arrive to be told you are wrong. Free of charge."
  - **Lujin's:** "Nobody is sure what happens here. Lujin is."
- **Baggage:** fun "policies", such as "Bags may arrive before you. Or after. Or as a different bag."
- **In-Flight Service:** a menu with silly items and a fake safety demo. Scraggy is in charge.
- **Crew:** cards for the crew. Scraggy is Captain and CEO. Add a few made-up crew members.
- **Fleet:** four planes, one card each (section 5).
- **About / CEO:** a mock CEO letter from Scraggy.
- **Book a Flight:** a fake multi-step booking form (section 7.2). Every flight starts or ends at **SIA**. Logged-in users earn points; guests are told what they are missing.
- **Airport Guide:** see section 8.
- **Scraggy Points:** balance, current tier and progress bar to the next tier, and a history of points earned and spent. Guests see a log-in prompt.
- **Redeem:** the rewards catalogue (section 7).

---

## 4. Mdm Wrong Wrong quotes (every page)

Mdm Wrong-Wrong is an **English Teacher**, and every quote shows her attribution: "Mdm Wrong-Wrong, English Teacher". (The brief spells her name "Wrong Wrong" in some places and "Wrong-Wrong" in others; this plan uses **Mdm Wrong-Wrong** in quote credits. Tell me if you prefer one spelling everywhere.)

A shared component renders a quote box on every page. Quotes live in one file so they are easy to edit, and each page can have more than one quote (one is picked at random on each visit, plus a "Another one" button).

### Quotes from you (used as written)

| Quote | Best page |
|-------|-----------|
| "The snacks were good. The Wi-Fi was emotionally unavailable." | In-Flight Service |
| "I have 12 miles. Apparently this is enough for one biscuit." | Scraggy Points |
| "Scraggy First sounds luxurious. I demand pants." | Book a Flight (also fits the Pants tiers) |
| "Scraggy is haunting me." | Home (also About / CEO) |

### Placeholder quotes for the other pages (rewrite freely)

| Page | Placeholder |
|------|-------------|
| Destinations | "Wrong destination. Try again. Actually, all of them are wrong." |
| Baggage | "That is not your bag. Now it is your problem." |
| Crew | "Wrong crew, wrong day. Very correct pilot though." |
| Fleet | "Those numbers are wrong. I checked. I was wrong." |
| Redeem | "That is the wrong thing to buy. Buy it anyway." |
| Airport Guide | "You are lost. I am not. I am also wrong, so it evens out." |
| Login | "Wrong password. Or right. Hard to say." |
| 404 | "You are wrong. The page is also wrong. We tie." |

```js
// js/quotes.js
const WHO = "Mdm Wrong-Wrong, English Teacher";

export const QUOTES = {
  home: [
    { text: "Scraggy is haunting me.", who: WHO }
  ],
  inflight: [
    { text: "The snacks were good. The Wi-Fi was emotionally unavailable.", who: WHO }
  ],
  points: [
    { text: "I have 12 miles. Apparently this is enough for one biscuit.", who: WHO }
  ],
  book: [
    { text: "Scraggy First sounds luxurious. I demand pants.", who: WHO }
  ],
  about: [
    { text: "Scraggy is haunting me.", who: WHO }   // reuse, or write a new one
  ],
  destinations: [{ text: "Wrong destination. Try again. Actually, all of them are wrong.", who: WHO }],
  baggage:      [{ text: "That is not your bag. Now it is your problem.", who: WHO }],
  crew:         [{ text: "Wrong crew, wrong day. Very correct pilot though.", who: WHO }],
  fleet:        [{ text: "Those numbers are wrong. I checked. I was wrong.", who: WHO }],
  redeem:       [{ text: "That is the wrong thing to buy. Buy it anyway.", who: WHO }],
  airport:      [{ text: "You are lost. I am not. I am also wrong, so it evens out.", who: WHO }],
  login:        [{ text: "Wrong password. Or right. Hard to say.", who: WHO }],
  notFound:     [{ text: "You are wrong. The page is also wrong. We tie.", who: WHO }]
};
```

Implementation: each page has `<div id="wrong-wrong" data-page="home"></div>` and `js/main.js` fills it with a random entry from `QUOTES[data-page]`. The "Another one" button pulls a random quote from **all** pages, so her best lines get seen everywhere. The Crew page also lists Mdm Wrong-Wrong as **English Teacher**.

---

## 5. Fleet and CEO

The plane names are intentionally silly (a real "Airbus 777" or "Boeing 330" does not exist). This is part of the joke. The site should never treat them as real, and each card can wink at that.

| Aircraft | Blurb idea |
|----------|-----------|
| Airbus 777 | "Has wings. We checked twice." |
| Boeing 330 | "Fits 330 passengers. We have never counted." |
| Airbus 747 | "The classic. Has a hump. Nobody knows why." |
| Boeing 380 | "So big it has its own weather." |

**CEO: Scraggy.** Every page footer says: "Scraggy Airlines. CEO: Scraggy. Legal team: also Scraggy."

---

## 6. Branding and logo

- **Logo:** Scraggy artwork on the left and the words **SCRAGGY AIRLINES** on the right, in the header of every page.
- **Assets needed:** `assets/scraggy.png` (the Scraggy image), `assets/logo.png` (Scraggy plus the words), `assets/favicon.png`. There is **no image of Mdm Wrong-Wrong**: her looks are ignored, and the quote box is text only (a speech bubble with her name and title).
- **Scraggy image (decision: use an image found online):**
  - Pick a clear image of Scraggy with a transparent background, ideally a fan-art image or sprite whose licence allows reuse.
  - **Download it and save it in `assets/`.** Do not link to it on the other website, because hotlinked images break and use the other site's bandwidth.
  - Record the image's source and creator in a `CREDITS.md` file and in the site footer.
  - Add this footer line: "Fan-made parody site. Not affiliated with or endorsed by Nintendo, Game Freak or The Pokémon Company. Scraggy is their character."
  - Scraggy is owned by Nintendo, Game Freak and The Pokémon Company, and this use is not licensed by them. That is a normal risk for a small non-commercial fan parody, but the owners can ask for it to be taken down. Keep the site free of ads and payments, and be ready to swap in an original mascot if asked.
- **Look and feel:** the same orange, yellow and brown as Scraggy, chunky bold headlines, and a slightly "broken airline" style (crooked stickers, cheeky "delayed" banners).
- **Fonts:** one bold display font for headlines and one plain readable font for body text.

---

## 7. Scraggy Points

### User flow

1. Guest opens `login.html` and picks **Sign up** or **Log in**.
2. Sign up: choose a **username** and **password**, confirm password. New accounts start with a joke welcome bonus of 100 points.
3. Log in works from any device. The header shows "Hi, username · 100 pts · tier" and a Log out button.
4. Earn points by **booking flights** (section 7.2) and spend them in the **Redeem** shop (section 7.3).

### Validation rules

- Username: 3–20 characters, letters, numbers and underscores. Unique, case-insensitive.
- Password: at least 8 characters.
- Friendly funny error messages (e.g. "That username is taken. Someone got there first. Like the bags.").

### 7.1 Tiers

| Tier | Points needed |
|------|---------------|
| No pants yet | 0–499 |
| **Bronze Pants** | 500+ |
| **Gold Pants** | 1,000+ |
| **Platinum Pants** | 10,000+ |
| **Scraggy Pants** | 25,000+ (placeholder, see note) |

Platinum and Scraggy are **two separate tiers**. The brief gave 10,000 for "platinum and scraggy pants" and no separate number for Scraggy Pants, so **Platinum Pants starts at 10,000** and **Scraggy Pants at 25,000** as a placeholder. Change the number in the `tier_for` function below (one line) if you want a different one.

**Tier is based on lifetime points earned**, not the current balance. Otherwise a user who redeems a reward would drop down a tier, which is no fun. The database keeps two numbers: `points` (spendable balance) and `lifetime_points` (only ever goes up).

Each tier shows a pants badge on the profile and in the header, and gets a joke perk:

- **Bronze Pants:** "Priority boarding for the wrong plane."
- **Gold Pants:** "Free imaginary snack every flight."
- **Platinum Pants:** "Personally ignored by the CEO."
- **Scraggy Pants:** "The CEO knows your name. The CEO cannot use it."

### 7.2 Booking flights (fake booking form) and earning points

Booking is fake (no payments, no real flights, **no card or payment fields at all**), but it is the way to earn points.

#### The one route rule

Scraggy International Airport (**SIA**) is the hub. **Every flight either starts at SIA or ends at SIA.** Nothing flies directly between two other places.

| Flight | Direction | Example |
|--------|-----------|---------|
| Outbound | SIA to a destination | SIA to Lujin's |
| Inbound | A destination to SIA | Mdm Wrong Wrong's to SIA |
| Return trip | Two legs: outbound then inbound | SIA to Scraggy House, then Scraggy House to SIA |
| Not allowed | Destination to destination | Lujin's to Scraggy House |

If a user tries Lujin's to Scraggy House, the form shows a joke error: "No direct flights. Everything goes through SIA. Even your sadness." The from and to dropdowns enforce this: choosing a destination as "From" locks "To" to SIA, and the other way around.

Flight numbers look like `SA` plus three digits, e.g. `SA101`. Suggested: SIA to Scraggy House is `SA101`, and Scraggy House to SIA is `SA102`, and so on.

#### Booking form (`book.html`)

A multi-step form with silly wording. Nothing is charged and no real personal data is needed. Steps:

1. **Trip:** one-way or return, **From** and **To** (one must be SIA), departure date, and return date if a return trip.
2. **Aircraft:** choose from the fleet (Airbus 777, Boeing 330, Airbus 747, Boeing 380) or "Surprise me (we will pick the wrong one)".
3. **Class:** Scraggy Economy, Scraggy Business, or **Scraggy First** ("Comes with pants"), which matches Mdm Wrong-Wrong's quote on this page.
4. **Passenger:** a name (defaults to the username; a fake name is fine), seat preference (window, aisle, "somewhere"), snack preference, and number of bags ("Bags will be lost in 1 to 5 places").
5. **Fun extras:** "Reason for travelling" (dropdown of joke options), tick boxes like "I accept that Scraggy is the CEO" and "I accept that we may go somewhere else eventually".
6. **Review and confirm:** shows the whole trip, the points that will be earned, and a "Confirm (no money will be taken)" button. Payment is just "Paid in vibes".

After confirming, the page shows a fake **boarding pass** per leg: flight number, SIA on one end, date, aircraft, seat, assigned **gate** (SCG001 to SCG003, see section 8) and a booking reference like `SCRAG-4821`. A "View in Airport Guide" link goes to that gate. The Mdm Wrong-Wrong quote box stays on the page.

Guests can fill in the form but at the last step are asked to log in or sign up to confirm and earn points. Filled-in values are kept in the page while they sign up so nothing is lost.

Use plain HTML form elements with real labels (accessible and works on phones). Validate in the browser for a friendly experience, and again in the database function for safety.

#### Points earned per flight leg

| Flight leg (to or from SIA) | Points earned |
|-----------------------------|---------------|
| SIA <-> **Scraggy House** | 100 |
| SIA <-> **Mdm Wrong Wrong's** | 250 |
| SIA <-> **Lujin's** | 250 |
| Scraggy First class | +50 per leg |
| Finding **Gate 9¾** (once only, section 8) | 500 |
| Welcome bonus at sign-up | 100 |

A return trip is two legs, so it earns points twice. The numbers are placeholders and easy to change in one place. Each leg is saved in the `bookings` table with the origin, destination, direction, class, aircraft, gate and booking reference.

**Stopping cheating:** a browser can be edited by anyone, so the browser must never tell the database how many points to add. Points are added only by a database function (`book_flight`) that checks the route rule, looks up the points from the route and class itself, and saves the booking. To stop people farming points by clicking "book" forever, the function allows a limited number of bookings per day per user (suggested: 5 legs). This limit is a fun rule too: "Sorry, you have flown too much today."

### 7.3 Redeeming points (the rewards shop)

Redeeming subtracts from `points` (the balance) but never from `lifetime_points`, so tiers are safe.

| Reward | Cost | Notes |
|--------|------|-------|
| Digital Scraggy sticker | 200 | Shows on the profile |
| Free imaginary snack | 300 | A voucher for a snack that does not exist |
| Bag "upgrade" | 500 | Your bag is lost in first class |
| Voicemail from Mdm Wrong Wrong | 750 | A quote just for you |
| Custom seat name tag | 1,000 | Shown on the profile |
| Captain's hat (virtual) | 2,000 | Profile badge |
| Name a gate after yourself | 5,000 | Shows in the Airport Guide |
| Cockpit selfie with CEO Scraggy | 10,000 | The ultimate prize |

Rules:

- The shop shows the cost of every reward, greys out what the user cannot afford, and shows a friendly "You need 120 more points" message.
- Every purchase is written to a `redemptions` table and shows in the user's points history.
- Some rewards are once per account (badges, name tags), others can be bought repeatedly.
- The rewards are joke items, so nothing real is delivered or shipped. This should be clear on the page ("Rewards have no real-world value").

### 7.4 Database (Supabase)

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  points integer not null default 100 check (points >= 0),
  lifetime_points integer not null default 100,
  created_at timestamptz default now()
);

create table bookings (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  booking_ref text not null,
  flight_no text not null,
  origin text not null,
  destination text not null,
  direction text not null check (direction in ('outbound','inbound')),
  travel_class text not null check (travel_class in ('economy','business','first')),
  aircraft text not null,
  seat text,
  gate text not null,
  travel_date date not null,
  points_earned integer not null,
  created_at timestamptz default now(),
  -- The one route rule: every flight starts or ends at SIA, never both, never neither
  constraint sia_hub check ((origin = 'SIA') <> (destination = 'SIA'))
);

create table rewards (
  id text primary key,
  name text not null,
  cost integer not null check (cost > 0),
  once_only boolean not null default false
);

create table redemptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  reward_id text not null references rewards(id),
  cost integer not null,
  created_at timestamptz default now()
);

create table secret_finds (
  user_id uuid references profiles(id) on delete cascade,
  code text,
  created_at timestamptz default now(),
  primary key (user_id, code)
);

alter table profiles     enable row level security;
alter table bookings     enable row level security;
alter table rewards      enable row level security;
alter table redemptions  enable row level security;
alter table secret_finds enable row level security;

-- Read access only. No insert/update policies on points tables,
-- so the browser cannot change points directly.
create policy "read own profile"     on profiles     for select using (auth.uid() = id);
create policy "read own bookings"    on bookings     for select using (auth.uid() = user_id);
create policy "read own redemptions" on redemptions  for select using (auth.uid() = user_id);
create policy "read own finds"       on secret_finds for select using (auth.uid() = user_id);
create policy "anyone reads rewards" on rewards      for select using (true);
```

Profiles are created by a database trigger (or a `create_profile` function) at sign-up, so the browser never inserts into `profiles` itself.

The three actions that change points are database functions, called from the browser with `supabase.rpc(...)`. Each runs as `security definer`, checks `auth.uid()`, and does the whole change in one transaction:

```sql
-- Tier from lifetime points (single source of truth)
create function tier_for(pts integer) returns text language sql immutable as $$
  select case
    when pts >= 25000 then 'Scraggy Pants'
    when pts >= 10000 then 'Platinum Pants'
    when pts >= 1000  then 'Gold Pants'
    when pts >= 500   then 'Bronze Pants'
    else 'No pants yet'
  end
$$;

-- book_flight(trip details): checks the SIA route rule and the daily limit,
--   picks the flight number and gate, looks up the points for the route and
--   class, inserts one bookings row per leg (two for a return trip), adds the
--   points to both points and lifetime_points, returns the new totals and
--   the booking references for the boarding passes.
-- redeem_reward(reward_id): checks the balance and once_only rule, subtracts
--   the cost from points only, inserts a redemptions row, returns the new balance.
-- claim_secret('gate-9-3-4'): awards the Gate 9¾ bonus once per user.
```

### 7.5 Client code (sketch)

```js
// js/auth.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const toEmail = (u) => `${u.trim().toLowerCase()}@scraggyairlines.invalid`;

export async function signUp(username, password) {
  const { error } = await supabase.auth.signUp({
    email: toEmail(username),
    password,
    options: { data: { username } }   // trigger reads this to create the profile
  });
  if (error) throw error;
}

export const logIn  = (u, p) => supabase.auth.signInWithPassword({ email: toEmail(u), password: p });
export const logOut = () => supabase.auth.signOut();

// js/points.js
export const bookFlight   = (trip) => supabase.rpc("book_flight", {
  p_origin: trip.origin,           // "SIA" or a destination
  p_destination: trip.destination, // the other end (must not also be SIA)
  p_return: trip.isReturn,         // true = also books the inbound leg
  p_class: trip.travelClass,
  p_aircraft: trip.aircraft,
  p_seat: trip.seat,
  p_date: trip.date
});
export const redeemReward = (rewardId)              => supabase.rpc("redeem_reward", { p_reward_id: rewardId });
export const claimSecret  = (code)                  => supabase.rpc("claim_secret", { p_code: code });
```

---

## 8. Airport Guide

**Page:** `airport.html`
**Headline:** **LOST? WE WILL MAKE YOU MORE LOST**
**Mdm Wrong Wrong quote:** "You are lost. I am not. I am also wrong, so it evens out."

### Concept

A silly, unhelpful guide to **Scraggy International Airport (SIA)**, the hub every Scraggy flight starts or ends at. It looks like a proper airport directory but every direction makes things worse. It also shows the gate a user was assigned when they booked.

### Gates

All gates are at SIA. Flights to the three destinations leave from SCG001 to SCG003; inbound flights arrive at the same gates.

Gates are numbered **SCG001**, **SCG002**, **SCG003** and so on. Each gate gets a short joke description. Example content (edit freely):

| Gate | Goes to | Joke |
|------|---------|------|
| SCG001 | Scraggy House | "The easy one. Do not get used to this." |
| SCG002 | Mdm Wrong Wrong's | "Please arrive wrong." |
| SCG003 | Lujin's | "Follow the signs. The signs are wrong." |
| SCG004 | Nowhere | "A gate to a wall. Very popular." |
| SCG005 | Baggage claim | "Your bag is at SCG003. Or SCG007. Or Lujin's." |
| SCG006 | Also SCG001 | "Same as SCG001, but further away." |
| SCG007 | Closed | "Closed for being open." |
| SCG008 | Snack corner | "Snacks are a state of mind." |
| SCG009 | Departures | "Turn left. No, the other left." |
| **Gate 9¾** | ✨ Magic only ✨ | See below |
| SCG010 | The rest of the airport | "Still lost? Good." |
| SCG011 | The last gate | "You made it to the end. There is nothing here. Well done." |

The airport has **11 gates, SCG001 to SCG011**, plus the hidden Gate 9¾. Gate 9¾ sits **between SCG009 and SCG010** in the list, on a wall marked "Gate 9¾", and has no normal bookings or direct link.

### How the gate list is stored

Keep gates in one data file (`js/airport.js`) so they are easy to edit:

```js
export const GATES = [
  { id: "SCG001", to: "Scraggy House",     joke: "The easy one. Do not get used to this." },
  { id: "SCG002", to: "Mdm Wrong Wrong's", joke: "Please arrive wrong." },
  { id: "SCG003", to: "Lujin's",           joke: "Follow the signs. The signs are wrong." },
  // ...SCG004 to SCG009...
  { id: "GATE-9-3-4", label: "Gate 9¾", magic: true },
  { id: "SCG010", to: "The rest of the airport", joke: "Still lost? Good." },
  { id: "SCG011", to: "The last gate", joke: "You made it to the end. There is nothing here. Well done." }
];
```

When a flight is booked, the gate for that route (SCG001 to SCG003) is shown on the boarding pass and saved in `bookings.gate`. Also add a simple SIA map or list at the top of the page: "You are here (probably)."

### Gate 9¾: the magic gate

**Rule:** the gate does not open until the visitor "performs magic".

The gate appears as a locked brick wall with the text "Gate 9¾: Magic required" and a text box. The visitor must **type the spell**: `scraggy-cadabra` (not case sensitive, spaces and dashes ignored). Wrong spells get a funny response from Mdm Wrong-Wrong (e.g. "Wrong spell. Try being more magical.").

When unlocked:

- The wall opens with an animation and shows a secret page: a tiny waiting room, Scraggy in a wizard hat and a special Mdm Wrong Wrong quote.
- Logged-in users can claim a one-time **500-point** bonus via `claim_secret` (`secret_finds` table stops repeat claims).
- Guests can see the secret room but are told they would have earned points if they were logged in.

The spell check is only for fun and lives in the browser, so it is not a secret. The 500-point bonus is safe because the database gives it out only once per user.

The word "Gate 9¾" is a nod to a well-known fictional platform. Keep it as a light joke (no official artwork, names or quotes from that franchise).

---

## 9. Tech stack and project structure

**Stack:** plain HTML, CSS and JavaScript (no build step) plus Supabase. Keeping it simple makes GitHub Pages deployment trivial.

```
scraggy-airlines/
├── index.html
├── destinations.html
├── baggage.html
├── inflight.html
├── crew.html
├── fleet.html
├── about.html
├── book.html
├── airport.html
├── points.html
├── redeem.html
├── login.html
├── 404.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js        # shared header/footer, quote box
│   ├── quotes.js      # Mdm Wrong Wrong quotes
│   ├── auth.js        # Supabase sign up / log in / out
│   ├── points.js      # book flights, redeem, tiers display
│   ├── airport.js     # gate list and Gate 9¾ magic
│   └── config.js      # Supabase URL + anon key (public keys only)
├── assets/
│   ├── scraggy.png    # Scraggy image saved locally (see CREDITS.md)
│   ├── logo.png       # Scraggy beside the words SCRAGGY AIRLINES
│   └── favicon.png
├── CREDITS.md         # image sources and creators
├── DEVELOPMENT.md
└── README.md
```

---

## 10. Build phases

| Phase | Work | Done when |
|-------|------|-----------|
| 1. Foundation | Repo, folder structure, shared header/footer, logo, CSS theme | Every page shows logo, nav and footer |
| 2. Content pages | Home, Destinations, Baggage, In-Flight, Crew, Fleet, About, 404 | All headlines and jokes are in |
| 3. Mdm Wrong Wrong | `quotes.js` and quote component on every page | Each page shows its own quote |
| 4. Backend | Supabase project, `profiles` table, RLS policies | Test user can sign up and read own row only |
| 5. Scraggy Points | `login.html`, `points.html`, header login state, tier badges | Sign up on one device, log in on another, tier shows correctly at 0, 500, 1,000 and 10,000 |
| 6. Booking and rewards | `book.html` (multi-step fake form and boarding pass), `redeem.html`, the three database functions | SIA route rule enforced; booking adds points; redeeming subtracts; tier never drops after spending |
| 7. Airport Guide | `airport.html`, gate list, Gate 9¾ | All gates show; the magic gate opens with the spell |
| 8. Polish | Responsive layout, accessibility, animations, meta tags | Looks right on a phone; Lighthouse accessibility 90+ |
| 9. Deploy | Push to GitHub, enable Pages | Live URL works |

---

## 11. Deploying to GitHub Pages

1. Create a GitHub repository, e.g. `scraggy-airlines`.
2. From the project folder:

```bash
git init
git add .
git commit -m "Initial Scraggy Airlines site"
git branch -M main
git remote add origin https://github.com/<your-username>/scraggy-airlines.git
git push -u origin main
```

3. In the repo, go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose **main** and **/ (root)**, then Save.
4. After about a minute the site is live at `https://<your-username>.github.io/scraggy-airlines/`.
5. In Supabase, add that URL under **Authentication → URL Configuration** as the site URL.

Notes:

- Use **relative links** (`css/styles.css`, not `/css/styles.css`), because project sites live under `/scraggy-airlines/`.
- Every push to `main` redeploys automatically.
- Optional: a custom domain can be added later in Settings → Pages.

---

## 12. Testing checklist

- [ ] Every page has the logo, nav, its headline, and a Mdm Wrong Wrong quote
- [ ] Home says **FLY SOMEWHERE EVENTUALLY**; Baggage says **YOUR BAGS. OUR MYSTERY.**
- [ ] All three destinations appear: Scraggy House, Mdm Wrong Wrong's, Lujin's
- [ ] All four aircraft appear; Scraggy is named CEO
- [ ] Sign up works, duplicate usernames are rejected, weak passwords are rejected
- [ ] Log in works on a second device or browser
- [ ] Logged-in users cannot see or change other users' data
- [ ] Logged-out users are redirected from `points.html` to `login.html`
- [ ] Mobile layout works; images have alt text; contrast is readable
- [ ] Tiers: 499 = no pants, 500 = Bronze Pants, 1,000 = Gold Pants, 10,000 = Platinum Pants, 25,000 = Scraggy Pants
- [ ] Redeeming lowers the balance but does **not** lower the tier
- [ ] Booking a flight adds the correct points; the daily booking limit works
- [ ] Every bookable flight has SIA at one end; destination-to-destination is refused (form and database)
- [ ] Return trip creates two legs (outbound and inbound) and two boarding passes
- [ ] The booking form has no card or payment fields, and shows the fake boarding pass at the end
- [ ] Guests keep their form entries after logging in
- [ ] The four supplied Mdm Wrong-Wrong quotes appear on Home, In-Flight, Points and Book, with "English Teacher" credit
- [ ] Editing points from the browser console does nothing (only database functions change points)
- [ ] Cannot redeem with too few points, or redeem a once-only reward twice
- [ ] Airport Guide shows the headline **LOST? WE WILL MAKE YOU MORE LOST** and gates starting at SCG001
- [ ] Gate 9¾ stays locked until the spell is entered; the 500-point bonus can be claimed only once
- [ ] No secrets in the repo (only the public anon key)

---

## 13. Decisions and remaining questions

### Decided

| Topic | Decision |
|-------|----------|
| Scraggy artwork | Use an image found online, saved into `assets/` with credit and a fan-parody disclaimer (section 6) |
| Mdm Wrong-Wrong's look | Ignored. Text-only quote box, no picture |
| Booking | Opens a fake, joke multi-step booking form (section 7.2) |
| Tiers | Bronze 500+, Gold 1,000+, Platinum Pants 10,000+, Scraggy Pants 25,000+ (placeholder), all based on **lifetime points** |
| Points and prices | 100 / 250 points per flight and the section 7.3 reward prices are the starting numbers |
| Gate 9¾ | Opened by typing the spell `scraggy-cadabra` |
| Gate count | SCG001 to SCG011, plus Gate 9¾ |
| Backend | Supabase (section 2), so accounts work on any device |

### Still open (small, and easy to change later)

1. **Scraggy Pants threshold:** is 25,000 points okay, or do you want a different number?
2. **Quote spelling:** "Mdm Wrong Wrong" or "Mdm Wrong-Wrong" everywhere?
3. **Flight numbers and references:** OK with `SA101` and up, and booking references like `SCRAG-4821`?
4. **Classes:** are Scraggy Economy, Business and **First** (with pants) right, and is +50 points for First okay?
