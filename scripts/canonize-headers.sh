#!/bin/bash
# Bulk canonize remaining ad-hoc h1 headers to use PageHeader component
# This script processes page.tsx files that have inline h1 elements

cd "$(dirname "$0")/.."

# Find all page.tsx files with the ad-hoc header pattern that don't already import PageHeader
FILES=$(grep -rl 'text-2xl font-semibold tracking-tight text-foreground' src/app/app/ --include="page.tsx" | xargs grep -L 'PageHeader' 2>/dev/null)

echo "Files needing PageHeader canonization:"
echo "$FILES" | while read -r f; do echo "  $f"; done
echo ""
echo "Total: $(echo "$FILES" | wc -l | tr -d ' ') files"
