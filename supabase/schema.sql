create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('Manager', 'Dispatcher', 'Safety Officer', 'Finance');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role public.app_role not null default 'Manager',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id text primary key,
  name text not null,
  type text not null check (type in ('Truck', 'Van', 'Bike')),
  license_plate text not null,
  max_capacity integer not null default 0,
  odometer integer not null default 0,
  status text not null check (status in ('Available', 'On Trip', 'In Shop', 'Retired')),
  region text not null default 'Central',
  last_service date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id text primary key,
  name text not null,
  license_expiry date not null,
  license_categories text[] not null default '{}',
  status text not null check (status in ('On Duty', 'Off Duty', 'Suspended', 'On Trip')),
  safety_score integer not null default 100,
  trips_completed integer not null default 0,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id text primary key,
  vehicle_id text not null,
  driver_id text not null,
  origin text not null,
  destination text not null,
  cargo_weight numeric not null default 0,
  status text not null check (status in ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_logs (
  id text primary key,
  vehicle_id text not null,
  type text not null,
  description text not null,
  cost numeric not null default 0,
  date date not null default current_date,
  status text not null check (status in ('Scheduled', 'In Progress', 'Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fuel_logs (
  id text primary key,
  vehicle_id text not null,
  liters numeric not null default 0,
  cost numeric not null default 0,
  date date not null default current_date,
  odometer integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

drop trigger if exists set_drivers_updated_at on public.drivers;
create trigger set_drivers_updated_at
before update on public.drivers
for each row execute function public.set_updated_at();

drop trigger if exists set_trips_updated_at on public.trips;
create trigger set_trips_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists set_maintenance_logs_updated_at on public.maintenance_logs;
create trigger set_maintenance_logs_updated_at
before update on public.maintenance_logs
for each row execute function public.set_updated_at();

drop trigger if exists set_fuel_logs_updated_at on public.fuel_logs;
create trigger set_fuel_logs_updated_at
before update on public.fuel_logs
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'Transportation Helper User'),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'Manager')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.trips enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.fuel_logs enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "fleet read authenticated" on public.vehicles;
create policy "fleet read authenticated"
on public.vehicles for select
to authenticated
using (true);

drop policy if exists "fleet write authenticated" on public.vehicles;
create policy "fleet write authenticated"
on public.vehicles for all
to authenticated
using (true)
with check (true);

drop policy if exists "drivers read authenticated" on public.drivers;
create policy "drivers read authenticated"
on public.drivers for select
to authenticated
using (true);

drop policy if exists "drivers write authenticated" on public.drivers;
create policy "drivers write authenticated"
on public.drivers for all
to authenticated
using (true)
with check (true);

drop policy if exists "trips read authenticated" on public.trips;
create policy "trips read authenticated"
on public.trips for select
to authenticated
using (true);

drop policy if exists "trips write authenticated" on public.trips;
create policy "trips write authenticated"
on public.trips for all
to authenticated
using (true)
with check (true);

drop policy if exists "maintenance read authenticated" on public.maintenance_logs;
create policy "maintenance read authenticated"
on public.maintenance_logs for select
to authenticated
using (true);

drop policy if exists "maintenance write authenticated" on public.maintenance_logs;
create policy "maintenance write authenticated"
on public.maintenance_logs for all
to authenticated
using (true)
with check (true);

drop policy if exists "fuel read authenticated" on public.fuel_logs;
create policy "fuel read authenticated"
on public.fuel_logs for select
to authenticated
using (true);

drop policy if exists "fuel write authenticated" on public.fuel_logs;
create policy "fuel write authenticated"
on public.fuel_logs for all
to authenticated
using (true)
with check (true);
