#!/usr/bin/env bash
# Regenerate all gift-audit packages (outreach-output/<domain>/) with the
# hardened June scanner + gift-first copy. Sequential on purpose — polite to
# the target sites and to the laptop's connection.
# Usage: bash scripts/regen-gift-audits.sh [max-pages]
set -u
cd "$(dirname "$0")/.."

MAX_PAGES="${1:-15}"
SITES=$(ls -d outreach-output/*/ | sed 's|outreach-output/||; s|/||')
TOTAL=$(echo "$SITES" | wc -l)
N=0

echo "Regenerating $TOTAL gift audits (max $MAX_PAGES pages each)"
for site in $SITES; do
  N=$((N+1))
  echo ""
  echo "### [$N/$TOTAL] $site — $(date +%H:%M:%S)"
  npx tsx scripts/outreach.ts "$site" --max-pages "$MAX_PAGES" 2>&1 \
    | grep -E "Canonical|Found|Crawled|Done:|Affiliate issues|Unverifiable|revenue at risk|ready|No pages found" \
    || echo "### FAILED: $site"
done
echo ""
echo "### ALL DONE — $(date +%H:%M:%S)"
