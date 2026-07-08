-- Read-only funnel counts for the Foreman heartbeat (C:\DEV\foreman) — Gate 2 tracking.
-- Decision #0001 Gate 2: 100 free scans + first paid by 2026-07-31.
-- security definer so it can count RLS-locked tables; returns only integers.
-- Counting window starts 2026-07-01 (go-live era) so pre-launch test rows don't inflate the gate.
create or replace function public.funnel_counts()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'scans',  (select count(*) from public.free_scan_results where created_at >= '2026-07-01'),
    'emails', (select count(*) from public.free_scan_leads   where created_at >= '2026-07-01' and email is not null),
    'paid',   (select count(*) from public.users
               where stripe_subscription_id is not null
                 and stripe_current_period_end > now())
  );
$$;

revoke all on function public.funnel_counts() from public;
grant execute on function public.funnel_counts() to anon;
