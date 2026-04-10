import appConfig from "./config";

export const apiBaseUrl = appConfig.API_BASE_URL;

export function apiUrl(path: string) {
  return new URL(path, apiBaseUrl).toString();
}

type ApiEnvelope<T> = {
  data: T | null;
  error: string;
  status: boolean;
};

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.status) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload.data as T;
}
