-- Read-only LinkRescue recovery verification
select
  to_regclass('public.users') as users_table,
  to_regclass('public.sites') as sites_table,
  to_regclass('public.org_members') as org_members_table,
  to_regclass('public.free_scan_leads') as free_scan_leads_table,
  to_regclass('public.free_scan_results') as free_scan_results_table,
  to_regclass('public.blog_posts') as blog_posts_table,
  to_regprocedure('public.funnel_counts()') as funnel_counts_function;