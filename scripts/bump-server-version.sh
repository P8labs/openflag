#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="$ROOT_DIR/VERSION"

usage() {
  echo "Usage: $0 [major|minor|patch|X.Y.Z]"
  exit 1
}

next_version() {
  local current="$1"
  local bump="$2"

  if [[ "$bump" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "$bump"
    return
  fi

  IFS='.' read -r major minor patch <<< "$current"
  case "$bump" in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "$major.$((minor + 1)).0" ;;
    patch) echo "$major.$minor.$((patch + 1))" ;;
    *) usage ;;
  esac
}

if [[ $# -ne 1 ]]; then
  usage
fi

BUMP="$1"
CURRENT_VERSION="0.0.0"
if [[ -f "$VERSION_FILE" ]]; then
  CURRENT_VERSION="$(tr -d '[:space:]' < "$VERSION_FILE")"
fi

if ! [[ "$CURRENT_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid current version in VERSION file: $CURRENT_VERSION"
  exit 1
fi

NEW_VERSION="$(next_version "$CURRENT_VERSION" "$BUMP")"
printf '%s\n' "$NEW_VERSION" > "$VERSION_FILE"

echo "Server version bumped: $CURRENT_VERSION -> $NEW_VERSION"
echo "Suggested tag: api-v$NEW_VERSION"
