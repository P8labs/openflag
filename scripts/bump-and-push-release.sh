#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="$ROOT_DIR/VERSION"
PACKAGE_JSON="$ROOT_DIR/web/package.json"

usage() {
  cat <<'EOF'
Usage: ./scripts/bump-and-push-release.sh [major|minor|patch|X.Y.Z] [remote]

Examples:
  ./scripts/bump-and-push-release.sh patch
  ./scripts/bump-and-push-release.sh 1.2.3
  ./scripts/bump-and-push-release.sh minor upstream

Behavior:
  1) Bumps server version in VERSION
  2) Sets client version in web/package.json to the same exact version
  3) Commits VERSION + web/package.json
  4) Creates git tag v<version>
  5) Pushes current branch and tag to remote
EOF
  exit 1
}

require_clean_worktree() {
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree is not clean. Commit or stash changes before running this script."
    exit 1
  fi
}

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage
fi

BUMP="$1"
REMOTE="${2:-origin}"

if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This script must be run inside the git repository."
  exit 1
fi

cd "$ROOT_DIR"
require_clean_worktree

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" == "HEAD" ]]; then
  echo "Detached HEAD is not supported. Checkout a branch first."
  exit 1
fi

echo "Bumping server version..."
./scripts/bump-server-version.sh "$BUMP"

SERVER_VERSION="$(tr -d '[:space:]' < "$VERSION_FILE")"
if ! [[ "$SERVER_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid server version after bump: $SERVER_VERSION"
  exit 1
fi

echo "Aligning client version to $SERVER_VERSION..."
./scripts/bump-client-version.sh "$SERVER_VERSION"

if [[ ! -f "$PACKAGE_JSON" ]]; then
  echo "Missing file: $PACKAGE_JSON"
  exit 1
fi

TAG="v$SERVER_VERSION"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag already exists locally: $TAG"
  exit 1
fi

git add .

git commit -m "chore(release): v$SERVER_VERSION"
git tag "$TAG"

echo "Pushing branch $CURRENT_BRANCH to $REMOTE..."
git push "$REMOTE" "$CURRENT_BRANCH"

echo "Pushing tag $TAG to $REMOTE..."
git push "$REMOTE" "$TAG"

echo "Release prepared and pushed successfully."
echo "Version: $SERVER_VERSION"
echo "Tag: $TAG"
