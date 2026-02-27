-- ============================================================
-- LinkRescue Activation Funnel Analysis Queries
-- Run these in Supabase SQL Editor for comprehensive analysis
-- ============================================================

-- Set the time window (adjust as needed)
-- For last 30 days:
WITH time_window AS (
  SELECT 
    NOW() - INTERVAL '30 days' as start_date,
    NOW() as end_date
)

-- ============================================================
-- 1. OVERALL FUNNEL METRICS (Last 30 Days)
-- ============================================================
,
signups AS (
  SELECT COUNT(*) as total_signups
  FROM auth.users
  WHERE created_at >= (SELECT start_date FROM time_window)
),

users_with_sites AS (
  SELECT COUNT(DISTINCT user_id) as users_with_sites
  FROM sites
  WHERE created_at >= (SELECT start_date FROM time_window)
),

users_with_scans AS (
  SELECT COUNT(DISTINCT s.user_id) as users_with_scans
  FROM sites s
  JOIN scans sc ON sc.site_id = s.id
  WHERE sc.created_at >= (SELECT start_date FROM time_window)
),

users_with_multiple_scans AS (
  SELECT COUNT(*) as users_returned
  FROM (
    SELECT s.user_id
    FROM sites s
    JOIN scans sc ON sc.site_id = s.id
    WHERE sc.created_at >= (SELECT start_date FROM time_window)
    GROUP BY s.user_id
    HAVING COUNT(sc.id) >= 2
  ) multi_scan_users
),

paid_conversions AS (
  SELECT COUNT(*) as paid_users
  FROM users
  WHERE stripe_price_id IS NOT NULL
    AND created_at >= (SELECT start_date FROM time_window)
)

SELECT 
  'Funnel Metrics (Last 30 Days)' as analysis_type,
  s.total_signups,
  uws.users_with_sites,
  ROUND(uws.users_with_sites::numeric / NULLIF(s.total_signups, 0) * 100, 1) as pct_added_site,
  uws2.users_with_scans,
  ROUND(uws2.users_with_scans::numeric / NULLIF(s.total_signups, 0) * 100, 1) as pct_ran_scan,
  ums.users_returned as users_with_2plus_scans,
  ROUND(ums.users_returned::numeric / NULLIF(s.total_signups, 0) * 100, 1) as pct_returned,
  pc.paid_users as converted_to_paid,
  ROUND(pc.paid_users::numeric / NULLIF(s.total_signups, 0) * 100, 1) as pct_paid
FROM signups s
CROSS JOIN users_with_sites uws
CROSS JOIN users_with_scans uws2
CROSS JOIN users_with_multiple_scans ums
CROSS JOIN paid_conversions pc;


-- ============================================================
-- 2. TIME-TO-ACTIVATION ANALYSIS
-- ============================================================

-- Average time from signup to first site added
WITH user_first_site AS (
  SELECT 
    u.id as user_id,
    u.created_at as signup_time,
    MIN(s.created_at) as first_site_time
  FROM auth.users u
  LEFT JOIN sites s ON s.user_id = u.id
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY u.id, u.created_at
  HAVING MIN(s.created_at) IS NOT NULL
),
signup_to_site_times AS (
  SELECT 
    user_id,
    EXTRACT(EPOCH FROM (first_site_time - signup_time)) / 3600 as hours_to_site
  FROM user_first_site
)
SELECT 
  'Time to First Site' as metric,
  ROUND(AVG(hours_to_site)::numeric, 1) as avg_hours,
  ROUND(MIN(hours_to_site)::numeric, 1) as min_hours,
  ROUND(MAX(hours_to_site)::numeric, 1) as max_hours,
  COUNT(*) as total_users,
  SUM(CASE WHEN hours_to_site <= 1 THEN 1 ELSE 0 END) as same_session,
  SUM(CASE WHEN hours_to_site > 1 AND hours_to_site <= 24 THEN 1 ELSE 0 END) as within_24h,
  SUM(CASE WHEN hours_to_site > 24 AND hours_to_site <= 168 THEN 1 ELSE 0 END) as within_7d,
  SUM(CASE WHEN hours_to_site > 168 THEN 1 ELSE 0 END) as beyond_7d
FROM signup_to_site_times;


-- Average time from site added to first scan
WITH site_first_scan AS (
  SELECT 
    s.id as site_id,
    s.user_id,
    s.created_at as site_time,
    MIN(sc.started_at) as first_scan_time
  FROM sites s
  LEFT JOIN scans sc ON sc.site_id = s.id
  WHERE s.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY s.id, s.user_id, s.created_at
  HAVING MIN(sc.started_at) IS NOT NULL
),
site_to_scan_times AS (
  SELECT 
    site_id,
    EXTRACT(EPOCH FROM (first_scan_time - site_time)) / 3600 as hours_to_scan
  FROM site_first_scan
)
SELECT 
  'Time to First Scan' as metric,
  ROUND(AVG(hours_to_scan)::numeric, 1) as avg_hours,
  ROUND(MIN(hours_to_scan)::numeric, 1) as min_hours,
  ROUND(MAX(hours_to_scan)::numeric, 1) as max_hours,
  COUNT(*) as total_sites
FROM site_to_scan_times;


-- ============================================================
-- 3. DROP-OFF ANALYSIS
-- ============================================================

-- Detailed conversion rates at each step
WITH time_window AS (
  SELECT NOW() - INTERVAL '30 days' as start_date
),

all_signups AS (
  SELECT id, created_at
  FROM auth.users
  WHERE created_at >= (SELECT start_date FROM time_window)
),

signup_to_site AS (
  SELECT DISTINCT u.id
  FROM all_signups u
  JOIN sites s ON s.user_id = u.id
  WHERE s.created_at >= (SELECT start_date FROM time_window)
),

site_to_scan AS (
  SELECT DISTINCT s.user_id
  FROM sites s
  JOIN scans sc ON sc.site_id = s.id
  WHERE sc.created_at >= (SELECT start_date FROM time_window)
),

scan_to_return AS (
  SELECT user_id
  FROM (
    SELECT s.user_id, COUNT(sc.id) as scan_count
    FROM sites s
    JOIN scans sc ON sc.site_id = s.id
    WHERE sc.created_at >= (SELECT start_date FROM time_window)
    GROUP BY s.user_id
    HAVING COUNT(sc.id) >= 2
  ) multi_scanners
)

SELECT 
  'Drop-off Analysis' as analysis_type,
  (SELECT COUNT(*) FROM all_signups) as total_signups,
  (SELECT COUNT(*) FROM signup_to_site) as added_site,
  ROUND((SELECT COUNT(*) FROM signup_to_site)::numeric / 
    NULLIF((SELECT COUNT(*) FROM all_signups), 0) * 100, 1) as signup_to_site_rate,
  (SELECT COUNT(*) FROM site_to_scan) as ran_scan,
  ROUND((SELECT COUNT(*) FROM site_to_scan)::numeric / 
    NULLIF((SELECT COUNT(*) FROM signup_to_site), 0) * 100, 1) as site_to_scan_rate,
  (SELECT COUNT(*) FROM scan_to_return) as returned,
  ROUND((SELECT COUNT(*) FROM scan_to_return)::numeric / 
    NULLIF((SELECT COUNT(*) FROM site_to_scan), 0) * 100, 1) as scan_to_return_rate;


-- ============================================================
-- 4. SITE-LEVEL PATTERNS
-- ============================================================

-- Average sites per user (for users who added at least 1)
WITH users_with_sites AS (
  SELECT user_id, COUNT(*) as site_count
  FROM sites
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
)
SELECT 
  'Sites per User' as metric,
  ROUND(AVG(site_count)::numeric, 2) as avg_sites,
  MIN(site_count) as min_sites,
  MAX(site_count) as max_sites,
  COUNT(*) as total_users_with_sites,
  SUM(CASE WHEN site_count = 1 THEN 1 ELSE 0 END) as users_with_1_site,
  SUM(CASE WHEN site_count >= 2 THEN 1 ELSE 0 END) as users_with_2plus_sites
FROM users_with_sites;


-- Domain type distribution
SELECT 
  CASE 
    WHEN domain LIKE '%.com' THEN '.com'
    WHEN domain LIKE '%.io' THEN '.io'
    WHEN domain LIKE '%.co%' THEN '.co/.co.uk'
    WHEN domain LIKE '%.org' THEN '.org'
    WHEN domain LIKE '%.net' THEN '.net'
    WHEN domain LIKE '%.ai' THEN '.ai'
    WHEN domain LIKE '%.dev' THEN '.dev'
    ELSE 'other'
  END as domain_type,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) as percentage
FROM sites
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY count DESC;


-- Verification success rate
SELECT 
  'Verification Status' as metric,
  COUNT(*) as total_sites,
  SUM(CASE WHEN verified_at IS NOT NULL THEN 1 ELSE 0 END) as verified,
  SUM(CASE WHEN verified_at IS NULL THEN 1 ELSE 0 END) as not_verified,
  ROUND(SUM(CASE WHEN verified_at IS NOT NULL THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as verification_rate
FROM sites
WHERE created_at >= NOW() - INTERVAL '30 days';


-- Scan success rate
SELECT 
  'Scan Status Distribution' as metric,
  status,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) as percentage
FROM scans
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status
ORDER BY count DESC;


-- Users with 0 pages crawled
SELECT 
  'Zero Pages Crawled Analysis' as metric,
  COUNT(*) as scans_with_zero_pages,
  COUNT(DISTINCT s.user_id) as affected_users,
  ROUND(AVG(CASE WHEN pages_scanned = 0 THEN 1 ELSE 0 END)::numeric * 100, 1) as zero_page_rate
FROM scans sc
JOIN sites s ON s.id = sc.site_id
WHERE sc.created_at >= NOW() - INTERVAL '30 days';


-- ============================================================
-- 5. ERROR PATTERNS
-- ============================================================

-- Failed scans by error type
SELECT 
  CASE 
    WHEN error_message ILIKE '%timeout%' THEN 'Timeout'
    WHEN error_message ILIKE '%dns%' OR error_message ILIKE '%ENOTFOUND%' THEN 'DNS Error'
    WHEN error_message ILIKE '%ssl%' OR error_message ILIKE '%certificate%' THEN 'SSL/Certificate'
    WHEN error_message ILIKE '%403%' OR error_message ILIKE '%forbidden%' THEN 'Access Denied (403)'
    WHEN error_message ILIKE '%404%' OR error_message ILIKE '%not found%' THEN 'Not Found (404)'
    WHEN error_message ILIKE '%5%' OR error_message ILIKE '%server error%' THEN 'Server Error (5xx)'
    WHEN error_message ILIKE '%rate%' OR error_message ILIKE '%limit%' THEN 'Rate Limited'
    WHEN error_message IS NULL THEN 'Unknown (no message)'
    ELSE 'Other'
  END as error_category,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) as percentage
FROM scans
WHERE status = 'failed'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY count DESC;


-- Scan events by level
SELECT 
  level,
  COUNT(*) as event_count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) as percentage
FROM scan_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY level
ORDER BY count DESC;


-- Most common error messages
SELECT 
  error_message,
  COUNT(*) as count
FROM scans
WHERE status = 'failed'
  AND error_message IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY error_message
ORDER BY count DESC
LIMIT 10;


-- ============================================================
-- 6. COHORT RETENTION ANALYSIS
-- ============================================================

-- Weekly cohort analysis
WITH weekly_cohorts AS (
  SELECT 
    DATE_TRUNC('week', created_at) as signup_week,
    id as user_id
  FROM auth.users
  WHERE created_at >= NOW() - INTERVAL '90 days'
),
cohort_activity AS (
  SELECT 
    wc.signup_week,
    wc.user_id,
    MIN(sc.created_at) as first_scan_date
  FROM weekly_cohorts wc
  LEFT JOIN sites s ON s.user_id = wc.user_id
  LEFT JOIN scans sc ON sc.site_id = s.id
  WHERE sc.created_at IS NOT NULL
  GROUP BY wc.signup_week, wc.user_id
)
SELECT 
  signup_week::date as week_start,
  COUNT(DISTINCT user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN first_scan_date IS NOT NULL THEN user_id END) as activated_users,
  ROUND(COUNT(DISTINCT CASE WHEN first_scan_date IS NOT NULL THEN user_id END)::numeric / 
    NULLIF(COUNT(DISTINCT user_id), 0) * 100, 1) as activation_rate
FROM cohort_activity
GROUP BY signup_week
ORDER BY signup_week DESC
LIMIT 12;


-- ============================================================
-- 7. USER ACTIVATION SEGMENTS
-- ============================================================

-- Segment users by their progress through the funnel
WITH user_progress AS (
  SELECT 
    u.id,
    u.created_at as signup_date,
    MIN(s.created_at) as first_site_date,
    MIN(sc.created_at) as first_scan_date,
    COUNT(DISTINCT sc2.id) as total_scans
  FROM auth.users u
  LEFT JOIN sites s ON s.user_id = u.id
  LEFT JOIN scans sc ON sc.site_id = s.id
  LEFT JOIN scans sc2 ON sc2.site_id = s.id
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY u.id, u.created_at
)
SELECT 
  CASE 
    WHEN first_site_date IS NULL THEN '1. Signed up only'
    WHEN first_scan_date IS NULL THEN '2. Added site, no scan'
    WHEN total_scans = 1 THEN '3. One scan only'
    WHEN total_scans >= 2 THEN '4. Multiple scans (activated)'
  END as user_segment,
  COUNT(*) as user_count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) as percentage
FROM user_progress
GROUP BY 1
ORDER BY 1;
