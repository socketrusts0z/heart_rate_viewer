-- Run this once in Supabase SQL Editor after schema.sql.
-- It deliberately exposes only username, latest BPM, and measurement time.
create or replace function public.latest_dashboard_readings()
returns table (username text, bpm numeric, measured_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select distinct on (r.user_id) p.username, r.bpm, r.measured_at
  from public.heart_rate_readings r
  join public.profiles p on p.id = r.user_id
  where r.measured_at >= now() - interval '7 days'
  order by r.user_id, r.measured_at desc;
$$;

revoke all on function public.latest_dashboard_readings() from public, authenticated;
grant execute on function public.latest_dashboard_readings() to anon;
