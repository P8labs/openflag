export const projectStatuses = ["dev", "live", "prototype"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export const projectStatusOptions = [
  { value: "dev", label: "Dev" },
  { value: "live", label: "Live" },
  { value: "prototype", label: "Prototype" },
] as const;

export function normalizeProjectStatus(value?: string | null): ProjectStatus {
  const status = value?.trim().toLowerCase();

  if (status === "dev" || status === "live" || status === "prototype") {
    return status;
  }

  return "dev";
}

export function projectStatusLabel(value?: string | null): string {
  switch (normalizeProjectStatus(value)) {
    case "live":
      return "Live";
    case "prototype":
      return "Prototype";
    default:
      return "Dev";
  }
}
