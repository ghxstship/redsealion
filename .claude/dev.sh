#!/bin/sh
# Ensure node is findable by Turbopack's subprocess spawner
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
cd "$(cd "$(dirname "$0")/.." && pwd)"
exec /usr/local/bin/node node_modules/next/dist/bin/next start --port 3001
