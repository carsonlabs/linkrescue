-- Tighten RLS on free_scan_results.
--
-- Current state (migration 012): `USING (true)` SELECT policy means anyone
-- with the anon Supabase key (which is public, embedded in every browser) can
-- enumerate every free-scan row via a bare REST request:
--     GET /rest/v1/free_scan_results?select=*
-- → leaks every scanned domain + broken-link detail ever submitted.
--
-- Actual usage: inserts and share-page reads both go through the service-role
-- admin client (apps/web/src/app/api/free-scan/route.ts,
-- apps/web/src/app/scan/[id]/page.tsx), so anon access isn't needed.
--
-- This migration swaps the policy: only service_role can read. Existing
-- shareable URLs keep working because the page reads server-side with admin.

DROP POLICY IF EXISTS "Anyone can view scan results" ON free_scan_results;
DROP POLICY IF EXISTS "free_scan_results_service_role" ON free_scan_results;

CREATE POLICY "free_scan_results_service_role"
  ON free_scan_results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- (No anon/authenticated policies — anon reads are denied by default.)
