#!/bin/sh
set -eu

if [ -z "${VITE_SUPABASE_URL:-}" ]; then
  echo "Missing required environment variable: VITE_SUPABASE_URL" >&2
  exit 1
fi

if [ -z "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" ]; then
  echo "Missing required environment variable: VITE_SUPABASE_PUBLISHABLE_KEY" >&2
  exit 1
fi

cat >/usr/share/nginx/html/env-config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_PUBLISHABLE_KEY: "${VITE_SUPABASE_PUBLISHABLE_KEY}",
};
EOF
