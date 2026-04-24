#!/bin/bash
# 50-site affiliate link rot data study
# Runs LinkRescue CLI against each site, saves JSON output
# Per-site timeout 120s to bound total time

CLI="/c/DEV/linkrescue/packages/cli/dist/cli.js"
SITES_FILE="/c/DEV/linkrescue/data-study/sites.txt"
OUT_DIR="/c/DEV/linkrescue/data-study/results"
LOG="/c/DEV/linkrescue/data-study/scan-log.txt"

echo "=== LinkRescue 50-site data study started at $(date) ===" > "$LOG"
count=0

while IFS= read -r site; do
  count=$((count+1))
  safe_name=$(echo "$site" | sed 's/[^a-zA-Z0-9]/_/g')
  out_file="$OUT_DIR/${safe_name}.json"

  echo "[$count/50] $site" | tee -a "$LOG"

  # Run scan with 120s timeout, JSON output
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

  # Polite delay between scans (don't hammer our network egress)
  sleep 2
done < "$SITES_FILE"

echo "=== Completed at $(date) ===" | tee -a "$LOG"
echo "Results in $OUT_DIR"
