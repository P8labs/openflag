export type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  username: string;
  usernameChangedAt?: string | null;
  bio: string | null;
  onboardState: number;
  interests: string[];
  skills: string[];
  availability: string | null;
  lookingFor: string | null;
};

export type Connections = {
  githubConnected: boolean;
  wakatimeConnected: boolean;
};

export type MeResponse = {
  user: User;
  connections: Connections;
};

export async function getCurrentUser(apiUrl: string) {
  const response = await fetch(apiUrl, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: MeResponse;
    error?: string;
    status?: boolean;
  } | null;

  if (!response.ok || !payload?.status) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload.data ?? null;
}
