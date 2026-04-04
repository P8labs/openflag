export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export function formatRelativeRisk(riskScore: number | null | undefined) {
  if (typeof riskScore !== "number") {
    return "—";
  }

  if (riskScore <= 30) {
    return "Low";
  }

  if (riskScore <= 70) {
    return "Medium";
  }

  return "High";
}
