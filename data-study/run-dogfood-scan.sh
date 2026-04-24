#!/bin/bash
# Dogfood scan: run LinkRescue against all of Carson's own live sites
# Output: one JSON per site, aggregated log at dogfood-log.txt

CLI="/c/DEV/linkrescue/packages/cli/dist/cli.js"
SITES_FILE="/c/DEV/linkrescue/data-study/dogfood-sites.txt"
OUT_DIR="/c/DEV/linkrescue/data-study/dogfood-results"
LOG="/c/DEV/linkrescue/data-study/dogfood-log.txt"

mkdir -p "$OUT_DIR"
echo "=== DOGFOOD SCAN started at $(date) ===" > "$LOG"

count=0
while IFS= read -r site; do
  count=$((count+1))
  safe_name=$(echo "$site" | sed 's/[^a-zA-Z0-9]/_/g')
  out_file="$OUT_DIR/${safe_name}.json"

  echo "[$count] $site" | tee -a "$LOG"
  timeout 120 node "$CLI" scan "$site" --json > "$out_file" 2>> "$LOG"
  exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo "  ✅ scanned" | tee -a "$LOG"
  elif [ $exit_code -eq 124 ]; then
    echo "  ⏱️  TIMEOUT" | tee -a "$LOG"
    echo "{\"error\":\"timeout\",\"site\":\"$site\"}" > "$out_file"
  else
    echo "  ❌ failed (exit $exit_code)" | tee -a "$LOG"
  fi

  sleep 2
done < "$SITES_FILE"

echo "=== DOGFOOD SCAN completed at $(date) ===" | tee -a "$LOG"
