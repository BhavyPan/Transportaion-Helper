alter table public.profiles
alter column role set default 'User';

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
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Transportation Helper User'
    ),
    'User'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name;

  return new;
end;
$$;

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and new.role is distinct from old.role then
    raise exception 'Profile roles cannot be changed by the authenticated user';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_self_role_change on public.profiles;
create trigger prevent_self_role_change
before update on public.profiles
for each row execute function public.prevent_self_role_change();

create or replace function public.has_app_role(allowed_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

revoke all on function public.has_app_role(public.app_role[]) from public;
grant execute on function public.has_app_role(public.app_role[]) to authenticated;

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id and role = 'User');

drop policy if exists "fleet read authenticated" on public.vehicles;
drop policy if exists "fleet write authenticated" on public.vehicles;
create policy "vehicles read by role"
on public.vehicles for select
to authenticated
using (public.has_app_role(array['Manager', 'Dispatcher', 'Safety Officer', 'Finance']::public.app_role[]));
create policy "vehicles write by role"
on public.vehicles for all
to authenticated
using (public.has_app_role(array['Manager', 'Dispatcher', 'Safety Officer']::public.app_role[]))
with check (public.has_app_role(array['Manager', 'Dispatcher', 'Safety Officer']::public.app_role[]));

drop policy if exists "drivers read authenticated" on public.drivers;
drop policy if exists "drivers write authenticated" on public.drivers;
create policy "drivers read by role"
on public.drivers for select
to authenticated
using (public.has_app_role(array['Manager', 'Dispatcher', 'Safety Officer', 'Finance']::public.app_role[]));
create policy "drivers write by role"
on public.drivers for all
to authenticated
using (public.has_app_role(array['Manager', 'Dispatcher', 'Safety Officer']::public.app_role[]))
with check (public.has_app_role(array['Manager', 'Dispatcher', 'Safety Officer']::public.app_role[]));

drop policy if exists "trips read authenticated" on public.trips;
drop policy if exists "trips write authenticated" on public.trips;
create policy "trips read by role"
on public.trips for select
to authenticated
using (public.has_app_role(array['Manager', 'Dispatcher', 'Finance']::public.app_role[]));
create policy "trips write by role"
on public.trips for all
to authenticated
using (public.has_app_role(array['Manager', 'Dispatcher']::public.app_role[]))
with check (public.has_app_role(array['Manager', 'Dispatcher']::public.app_role[]));

drop policy if exists "maintenance read authenticated" on public.maintenance_logs;
drop policy if exists "maintenance write authenticated" on public.maintenance_logs;
create policy "maintenance read by role"
on public.maintenance_logs for select
to authenticated
using (public.has_app_role(array['Manager', 'Safety Officer', 'Finance']::public.app_role[]));
create policy "maintenance write by role"
on public.maintenance_logs for all
to authenticated
using (public.has_app_role(array['Manager', 'Safety Officer']::public.app_role[]))
with check (public.has_app_role(array['Manager', 'Safety Officer']::public.app_role[]));

drop policy if exists "fuel read authenticated" on public.fuel_logs;
drop policy if exists "fuel write authenticated" on public.fuel_logs;
create policy "fuel read by role"
on public.fuel_logs for select
to authenticated
using (public.has_app_role(array['Manager', 'Finance']::public.app_role[]));
create policy "fuel write by role"
on public.fuel_logs for all
to authenticated
using (public.has_app_role(array['Manager', 'Finance']::public.app_role[]))
with check (public.has_app_role(array['Manager', 'Finance']::public.app_role[]));
