import fs from "node:fs";

const [, , packageJsonPath, bump] = process.argv;

if (!packageJsonPath || !bump) {
  console.error(
    "Usage: node update-client-version.mjs <package.json> <major|minor|patch|X.Y.Z>",
  );
  process.exit(1);
}

const semverRegex = /^\d+\.\d+\.\d+$/;

function computeVersion(current, token) {
  if (semverRegex.test(token)) {
    return token;
  }

  const [major, minor, patch] = current.split(".").map(Number);

  switch (token) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error("Invalid bump type. Use major, minor, patch, or X.Y.Z");
  }
}

const raw = fs.readFileSync(packageJsonPath, "utf8");
const pkg = JSON.parse(raw);

if (!semverRegex.test(pkg.version)) {
  throw new Error(`Current client version is invalid: ${pkg.version}`);
}

const next = computeVersion(pkg.version, bump);
pkg.version = next;

fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

console.log(`Client version bumped: ${next}`);
