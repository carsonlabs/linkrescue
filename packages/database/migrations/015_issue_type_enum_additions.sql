-- 015: Bring the issue_type enum up to date with the application code.
--
-- Two problems fixed:
--
-- 1. LATENT BUG: the crawler has written 'SOFT_404' and 'CONTENT_CHANGED'
--    since Phase 3, but migration 001's enum never included them. Those
--    scan_results inserts fail silently (the insert error is unchecked in
--    runScan), so soft-404 and content-change detections have been dropped
--    in production this whole time.
--
-- 2. NEW VALUE: 'BLOCKED' — destinations that refuse automated checks
--    (403 / 405 / 429 even after a GET retry). The scanner currently
--    persists these as 'OK' so dashboards don't report false positives;
--    adding the enum value now prepares the schema for first-class
--    blocked-link visibility once the dashboard query audit is done.
--
-- ALTER TYPE ... ADD VALUE IF NOT EXISTS is safe to re-run.

ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'SOFT_404';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'CONTENT_CHANGED';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'BLOCKED';
