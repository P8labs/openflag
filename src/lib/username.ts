export function slugifyUsername(input: string, fallback = "builder") {
  const normalized = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.slice(0, 24) || fallback;
}

export function buildDraftUsername(name: string, idSeed: string) {
  const base = slugifyUsername(name, "builder");
  const suffix = idSeed.slice(0, 6).toLowerCase();
  return `${base}_${suffix}`;
}
