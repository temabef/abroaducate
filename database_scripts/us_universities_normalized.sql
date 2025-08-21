-- us_universities_normalized: cache-on-read store for College Scorecard results
-- Safe to run multiple times

create table if not exists public.us_universities_normalized (
    id text primary key,
    name text not null,
    country text not null default 'United States',
    state text,
    city text,
    region text,
    acceptance_rate integer,
    avg_gpa numeric(3,2),
    avg_sat integer,
    cost integer not null,
    living_cost integer,
    in_state_tuition integer,
    out_of_state_tuition integer,
    scholarships boolean default true,
    scholarship_percentage integer,
    median_debt integer,
    graduate_earnings integer,
    location_type text,
    class_size text,
    research_opportunities text,
    student_size integer,
    ownership_type text,
    website_url text,
    data_source text,
    strengths text[],
    programs jsonb,
    requirements jsonb,
    last_updated timestamptz not null default now()
);

create index if not exists idx_us_unis_state on public.us_universities_normalized(state);
create index if not exists idx_us_unis_cost on public.us_universities_normalized(cost);
create index if not exists idx_us_unis_updated_at on public.us_universities_normalized(last_updated);
