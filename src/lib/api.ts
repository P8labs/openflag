import { NextResponse } from "next/server";

export type ApiEnvelope<T> = {
  data: T | null;
  error: string;
  status: boolean;
};

export function apiSuccess<T>(
  data: T,
  init?: ResponseInit,
): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json(
    {
      data,
      error: "",
      status: true,
    },
    init,
  );
}

export function apiError(
  error: string,
  status = 400,
): NextResponse<ApiEnvelope<null>> {
  return NextResponse.json(
    {
      data: null,
      error,
      status: false,
    },
    { status },
  );
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.status) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload.data as T;
}
