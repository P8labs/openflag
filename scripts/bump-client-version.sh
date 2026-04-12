#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_JSON="$ROOT_DIR/web/package.json"

usage() {
  echo "Usage: $0 [major|minor|patch|X.Y.Z]"
  exit 1
}

if [[ $# -ne 1 ]]; then
  usage
fi

BUMP="$1"

if [[ ! -f "$PACKAGE_JSON" ]]; then
  echo "Cannot find $PACKAGE_JSON"
  exit 1
fi

node "$ROOT_DIR/scripts/update-client-version.mjs" "$PACKAGE_JSON" "$BUMP"
