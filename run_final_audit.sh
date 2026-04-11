#!/bin/bash
export PATH=$PATH:/opt/homebrew/bin:/usr/local/bin:~/.nvm/current/bin
set -e

export CI=1

MAX_RUNS=5

echo "Starting 5x Consecutive Audit Run..."

for i in $(seq 1 $MAX_RUNS); do
  echo "=== RUN $i / $MAX_RUNS ==="
  
  # Run custom exhaustive stress audit
  echo "Running Stress Audit Script..."
  python3 stress_audit.py
  
  echo "✅ Run $i Passed"
  echo ""
done

echo "🏆🏆🏆 SUCCESS: 5 CONSECUTIVE RUNS PASSED WITH 0 FINDINGS 🏆🏆🏆"
