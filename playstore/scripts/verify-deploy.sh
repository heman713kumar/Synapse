#!/usr/bin/env bash
# Pre-submission sanity check.
# Usage: ./playstore/scripts/verify-deploy.sh https://synapse.app

set -e
DOMAIN="${1:-https://synapse.app}"
DOMAIN="${DOMAIN%/}"   # strip trailing slash

echo "🔍 Verifying $DOMAIN is ready for Play Store TWA submission..."
echo ""

# Helper
check() {
  local name="$1"
  local url="$2"
  local expected="$3"
  printf "  %-40s" "$name"
  local result
  result=$(curl -s -o /dev/null -w "%{http_code} %{content_type}" -L "$url" 2>/dev/null || echo "000")
  local code="${result%% *}"
  local ct="${result#* }"
  if [ "$code" = "200" ]; then
    if [ -n "$expected" ] && [[ "$ct" != *"$expected"* ]]; then
      echo "⚠ HTTP 200 but content-type $ct (expected $expected)"
      return 1
    fi
    echo "✓ HTTP 200"
    return 0
  fi
  echo "✗ HTTP $code"
  return 1
}

failed=0

echo "🌐 1. Web fundamentals"
check "Home page"            "$DOMAIN/"                            "text/html" || failed=$((failed+1))
check "Manifest (PWA)"       "$DOMAIN/manifest.json"               "json"      || failed=$((failed+1))
check "Service worker"       "$DOMAIN/sw.js"                       "javascript" || failed=$((failed+1))
check "Favicon"              "$DOMAIN/favicon.ico"                 ""          || failed=$((failed+1))
echo ""

echo "🔗 2. Digital Asset Links (required for TWA)"
check "assetlinks.json"      "$DOMAIN/.well-known/assetlinks.json" "json"      || failed=$((failed+1))
echo ""

echo "📜 3. Legal pages"
check "Privacy policy"       "$DOMAIN/privacy"                     ""          || failed=$((failed+1))
check "Terms of service"     "$DOMAIN/terms"                       ""          || failed=$((failed+1))
echo ""

echo "🎨 4. PWA icons"
check "Icon 192"             "$DOMAIN/icons/icon-192.png"          "image"     || failed=$((failed+1))
check "Icon 512"             "$DOMAIN/icons/icon-512.png"          "image"     || failed=$((failed+1))
echo ""

echo "🔒 5. Security headers (best practice)"
hsts=$(curl -s -I "$DOMAIN/" 2>/dev/null | grep -i 'strict-transport-security' || echo "")
csp=$(curl -s -I "$DOMAIN/" 2>/dev/null | grep -i 'content-security-policy' || echo "")
printf "  %-40s" "HTTPS / HSTS header"
if [ -n "$hsts" ]; then echo "✓"; else echo "⚠ (recommend: Strict-Transport-Security: max-age=31536000)"; fi
printf "  %-40s" "CSP header"
if [ -n "$csp" ]; then echo "✓"; else echo "⚠ (recommend: Content-Security-Policy set)"; fi
echo ""

echo "📋 6. Manifest validation (quick checks)"
if command -v jq >/dev/null 2>&1; then
  manifest=$(curl -s "$DOMAIN/manifest.json")
  for field in name start_url icons display theme_color; do
    val=$(echo "$manifest" | jq -r ".$field" 2>/dev/null || echo "null")
    printf "  %-40s" "Field: $field"
    if [ "$val" = "null" ] || [ -z "$val" ]; then echo "✗ missing"; failed=$((failed+1)); else echo "✓"; fi
  done
else
  echo "  (install jq to validate manifest fields)"
fi
echo ""

if [ $failed -eq 0 ]; then
  echo "✅ All checks passed. Ready to build the TWA!"
  echo ""
  echo "Next: cd playstore && bubblewrap init --manifest=$DOMAIN/manifest.json"
  exit 0
else
  echo "❌ $failed check(s) failed. Fix above before submitting."
  exit 1
fi
