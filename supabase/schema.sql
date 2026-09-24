-- Scraggy Airlines: database schema for Supabase (Postgres).
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run).
--
-- Design:
--  * The browser can only READ its own rows (Row Level Security).
--  * Points change ONLY through the functions at the bottom (book_flight, redeem_reward, claim_secret),
--    so nobody can give themselves points from the browser console.
--  * The rules here must match js/data.js.

-- ---------- Tables ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  points integer not null default 100 check (points >= 0),
  lifetime_points integer not null default 100,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));

create table if not exists public.routes (
  dest_id text primary key,
  base_points integer not null,
  out_no text not null,
  in_no text not null,
  gate text not null
);

create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_ref text not null,
  flight_no text not null,
  origin text not null,
  destination text not null,
  direction text not null check (direction in ('outbound','inbound')),
  travel_class text not null check (travel_class in ('economy','business','first','scraggy')),
  aircraft text not null,
  seat text,
  gate text not null,
  travel_date date not null,
  points_earned integer not null,
  created_at timestamptz not null default now(),
  -- The one route rule: every flight starts or ends at SIA, never both, never neither.
  constraint sia_hub check ((origin = 'SIA') <> (destination = 'SIA'))
);
create index if not exists bookings_user_created on public.bookings (user_id, created_at);

create table if not exists public.rewards (
  id text primary key,
  name text not null,
  cost integer not null check (cost > 0),
  once_only boolean not null default false,
  needs_note boolean not null default false
);

create table if not exists public.redemptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id text not null references public.rewards(id),
  cost integer not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.secret_finds (
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- ---------- Seed data ----------

insert into public.routes (dest_id, base_points, out_no, in_no, gate) values
  ('scraggy-house',   100, 'SA101', 'SA102', 'SCG001'),
  ('mdm-wrong-wrong', 250, 'SA103', 'SA104', 'SCG002'),
  ('lujin',           250, 'SA105', 'SA106', 'SCG003')
on conflict (dest_id) do nothing;

insert into public.rewards (id, name, cost, once_only, needs_note) values
  ('sticker',        'Digital Scraggy sticker',          200,   true,  false),
  ('snack',          'Free imaginary snack',             300,   false, false),
  ('bag-upgrade',    'Bag "upgrade"',                    500,   false, false),
  ('voicemail',      'Voicemail from Mdm Wrong-Wrong',   750,   false, false),
  ('seat-tag',       'Custom seat name tag',             1000,  true,  true),
  ('hat',            'Captain''s hat (virtual)',         2000,  true,  false),
  ('name-gate',      'Name a gate after yourself',       5000,  true,  true),
  ('cockpit-selfie', 'Cockpit selfie with CEO Scraggy',  10000, true,  false)
on conflict (id) do nothing;

-- ---------- Row Level Security: read-only, own rows only ----------

alter table public.profiles     enable row level security;
alter table public.routes       enable row level security;
alter table public.bookings     enable row level security;
alter table public.rewards      enable row level security;
alter table public.redemptions  enable row level security;
alter table public.secret_finds enable row level security;

drop policy if exists "read own profile"     on public.profiles;
drop policy if exists "read own bookings"    on public.bookings;
drop policy if exists "read own redemptions" on public.redemptions;
drop policy if exists "read own finds"       on public.secret_finds;
drop policy if exists "anyone reads rewards" on public.rewards;
drop policy if exists "anyone reads routes"  on public.routes;

create policy "read own profile"     on public.profiles     for select using (auth.uid() = id);
create policy "read own bookings"    on public.bookings     for select using (auth.uid() = user_id);
create policy "read own redemptions" on public.redemptions  for select using (auth.uid() = user_id);
create policy "read own finds"       on public.secret_finds for select using (auth.uid() = user_id);
create policy "anyone reads rewards" on public.rewards      for select using (true);
create policy "anyone reads routes"  on public.routes       for select using (true);
-- There are deliberately NO insert / update / delete policies: the browser cannot change points.

-- ---------- Create a profile when someone signs up ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Points functions (the ONLY way points change) ----------

-- Book a flight (one leg, or two for a return trip). Every flight must start or end at SIA.
create or replace function public.book_flight(
  p_origin text,
  p_destination text,
  p_return boolean,
  p_class text,
  p_aircraft text,
  p_seat text,
  p_date date,
  p_return_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_dest text;
  v_route public.routes%rowtype;
  v_legs int := case when coalesce(p_return, false) then 2 else 1 end;
  v_today int;
  v_bonus int;
  v_ref text;
  v_aircraft text := coalesce(nullif(p_aircraft, ''), 'surprise');
  v_seat text := case when p_seat in ('window','aisle','somewhere') then p_seat else 'somewhere' end;
  v_pts int;
  v_total int := 0;
  v_out boolean;
  v_result jsonb := '[]'::jsonb;
  v_profile public.profiles%rowtype;
begin
  if uid is null then raise exception 'not_logged_in'; end if;
  if p_origin is null or p_destination is null or (p_origin = 'SIA') = (p_destination = 'SIA') then
    raise exception 'sia_rule';
  end if;

  v_dest := case when p_origin = 'SIA' then p_destination else p_origin end;
  select * into v_route from public.routes where dest_id = v_dest;
  if not found then raise exception 'bad_route'; end if;

  v_bonus := case p_class
    when 'economy' then 0
    when 'business' then 0
    when 'first' then 50
    when 'scraggy' then 100
    else null end;
  if v_bonus is null then raise exception 'bad_class'; end if;

  if p_date is null or p_date < current_date then raise exception 'bad_date'; end if;
  if v_legs = 2 and (p_return_date is null or p_return_date < p_date) then raise exception 'bad_date'; end if;

  if v_aircraft = 'surprise' then
    v_aircraft := (array['airbus-777','boeing-330','airbus-747','boeing-380'])[1 + floor(random() * 4)::int];
  end if;
  if v_aircraft not in ('airbus-777','boeing-330','airbus-747','boeing-380') then
    raise exception 'bad_aircraft';
  end if;

  -- Fun limit: at most 5 flights per day per user (stops points farming).
  select count(*) into v_today from public.bookings
    where user_id = uid and created_at >= date_trunc('day', now());
  if v_today + v_legs > 5 then raise exception 'daily_limit'; end if;

  v_ref := 'SCRAG-' || lpad((floor(random() * 10000))::int::text, 4, '0');
  v_pts := v_route.base_points + v_bonus;
  v_out := (p_origin = 'SIA');

  -- First leg
  insert into public.bookings
    (user_id, booking_ref, flight_no, origin, destination, direction, travel_class, aircraft, seat, gate, travel_date, points_earned)
  values
    (uid, v_ref, case when v_out then v_route.out_no else v_route.in_no end,
     p_origin, p_destination, case when v_out then 'outbound' else 'inbound' end,
     p_class, v_aircraft, v_seat, v_route.gate, p_date, v_pts);
  v_total := v_total + v_pts;
  v_result := v_result || jsonb_build_object(
    'ref', v_ref,
    'flightNo', case when v_out then v_route.out_no else v_route.in_no end,
    'origin', p_origin, 'destination', p_destination,
    'direction', case when v_out then 'outbound' else 'inbound' end,
    'gate', v_route.gate, 'date', p_date, 'points', v_pts,
    'aircraft', v_aircraft, 'travelClass', p_class, 'seat', v_seat);

  -- Return leg (reverse direction)
  if v_legs = 2 then
    insert into public.bookings
      (user_id, booking_ref, flight_no, origin, destination, direction, travel_class, aircraft, seat, gate, travel_date, points_earned)
    values
      (uid, v_ref, case when v_out then v_route.in_no else v_route.out_no end,
       p_destination, p_origin, case when v_out then 'inbound' else 'outbound' end,
       p_class, v_aircraft, v_seat, v_route.gate, p_return_date, v_pts);
    v_total := v_total + v_pts;
    v_result := v_result || jsonb_build_object(
      'ref', v_ref,
      'flightNo', case when v_out then v_route.in_no else v_route.out_no end,
      'origin', p_destination, 'destination', p_origin,
      'direction', case when v_out then 'inbound' else 'outbound' end,
      'gate', v_route.gate, 'date', p_return_date, 'points', v_pts,
      'aircraft', v_aircraft, 'travelClass', p_class, 'seat', v_seat);
  end if;

  update public.profiles
    set points = points + v_total, lifetime_points = lifetime_points + v_total
    where id = uid
    returning * into v_profile;

  return jsonb_build_object(
    'ref', v_ref, 'legs', v_result, 'total', v_total,
    'points', v_profile.points, 'lifetime', v_profile.lifetime_points);
end;
$$;

-- Redeem a reward: subtracts from points (the balance) but never from lifetime_points (the tier).
create or replace function public.redeem_reward(p_reward_id text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.rewards%rowtype;
  bal int;
  v_lifetime int;
begin
  if uid is null then raise exception 'not_logged_in'; end if;
  select * into r from public.rewards where id = p_reward_id;
  if not found then raise exception 'bad_reward'; end if;

  select points, lifetime_points into bal, v_lifetime from public.profiles where id = uid for update;

  if r.once_only and exists (select 1 from public.redemptions where user_id = uid and reward_id = r.id) then
    raise exception 'already_redeemed';
  end if;
  if bal < r.cost then raise exception 'not_enough_points'; end if;
  if r.needs_note and (p_note is null or length(trim(p_note)) < 1) then raise exception 'note_required'; end if;

  update public.profiles set points = points - r.cost where id = uid;
  insert into public.redemptions (user_id, reward_id, cost, note)
  values (uid, r.id, r.cost, case when r.needs_note then left(trim(p_note), 30) else null end);

  return jsonb_build_object('points', bal - r.cost, 'lifetime', v_lifetime);
end;
$$;

-- One-time bonus for finding Gate 9 and three quarters.
create or replace function public.claim_secret(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n int;
  v_points int;
  v_lifetime int;
begin
  if uid is null then raise exception 'not_logged_in'; end if;
  if p_code is distinct from 'gate-9-3-4' then raise exception 'bad_code'; end if;

  insert into public.secret_finds (user_id, code) values (uid, p_code) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'already_claimed'; end if;

  update public.profiles
    set points = points + 500, lifetime_points = lifetime_points + 500
    where id = uid
    returning points, lifetime_points into v_points, v_lifetime;

  return jsonb_build_object('points', v_points, 'lifetime', v_lifetime);
end;
$$;

-- Only signed-in users may call the functions.
revoke all on function public.book_flight(text, text, boolean, text, text, text, date, date) from public, anon;
revoke all on function public.redeem_reward(text, text) from public, anon;
revoke all on function public.claim_secret(text) from public, anon;
grant execute on function public.book_flight(text, text, boolean, text, text, text, date, date) to authenticated;
grant execute on function public.redeem_reward(text, text) to authenticated;
grant execute on function public.claim_secret(text) to authenticated;
