export const SOFTWARE_TYPES = ["WEB", "MOBILE", "CLI", "OS", "UTIL"] as const;
export const SOFTWARE_STATUSES = [
  "PRE_REVIEWED",
  "PROCESSING",
  "PROCESSED",
  "ACTIVE",
  "FAILED",
] as const;

export const SOFTWARE_RISK_BANDS = [
  { key: "low", label: "Low", min: 0, max: 30 },
  { key: "medium", label: "Medium", min: 30, max: 70 },
  { key: "high", label: "High", min: 70, max: 100 },
] as const;

export type SoftwareTypeValue = (typeof SOFTWARE_TYPES)[number];
export type SoftwareStatusValue = (typeof SOFTWARE_STATUSES)[number];
export type RiskBandKey = (typeof SOFTWARE_RISK_BANDS)[number]["key"];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
