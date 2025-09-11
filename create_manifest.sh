#!/usr/bin/env zsh
set -e
set -u
set -o pipefail

# Usage:
#   ./create_manifest.zsh            # scans ./img
#   ./create_manifest.zsh /path/img  # scans a custom folder
IMG_DIR="${1:-./img}"
OUT_PATH="${IMG_DIR%/}/images.json"

if [[ ! -d "$IMG_DIR" ]]; then
  print -u2 "Error: '$IMG_DIR' not found or not a directory."
  exit 1
fi

TMPFILE="$(mktemp)"
trap 'rm -f "$TMPFILE"' EXIT

# Collect image basenames (case-insensitive), handle spaces safely, de-dupe
find -E "$IMG_DIR" -type f -iregex '.*\.(jpe?g|png|webp|avif|gif|bmp|tiff)' -print0 \
  | xargs -0 -n1 -I{} basename "{}" \
  | sort -fu > "$TMPFILE"

# Write JSON: prefer jq; otherwise use a tiny Python inline
if command -v jq >/dev/null 2>&1; then
  jq -R -s 'split("\n")[:-1]' "$TMPFILE" > "$OUT_PATH"
else
  if ! command -v python3 >/dev/null 2>&1; then
    print -u2 "Neither jq nor python3 found. Install one (brew install jq / python)."
    exit 1
  fi
  python3 -c 'import sys,json; p=sys.argv[1]; data=[l.strip() for l in sys.stdin if l.strip()]; open(p,"w",encoding="utf-8").write(json.dumps(data,ensure_ascii=False))' "$OUT_PATH" < "$TMPFILE"
fi

count=$(wc -l < "$TMPFILE" | tr -d '[:space:]')
print "Wrote $count entries to $OUT_PATH"
