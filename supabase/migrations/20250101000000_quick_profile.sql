-- Quick Profile table for lightweight matching
create table if not exists public.user_quick_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  degree_level text check (degree_level in ('undergraduate','masters','phd','graduate')) not null,
  field_of_study text not null,
  preferred_countries text[] default '{}'::text[] not null,
  gpa_range text check (gpa_range in ('<2.5','2.5-3.0','3.0-3.5','3.5-4.0')) not null,
  scholarship_priority text check (scholarship_priority in ('essential','high','moderate','low')) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_quick_profile enable row level security;

create policy "Users can manage their quick profile" on public.user_quick_profile
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at_quick_profile()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_set_updated_at_quick_profile on public.user_quick_profile;
create trigger trg_set_updated_at_quick_profile
before update on public.user_quick_profile
for each row execute function public.set_updated_at_quick_profile();

