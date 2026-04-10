import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";

import { apiFetch, apiUrl } from "@/lib/api";
import { getCurrentUser, type Connections, type User } from "@/lib/auth";
import LoadingPage from "@/pages/misc/LoadingPage";

type AuthContextValue = {
  user: User | null;
  connections: Connections;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60 * 1000,
      retry: 0,
      refetchOnWindowFocus: false,
    },
  },
});

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}

function AuthStateProvider({ children }: { children: ReactNode }) {
  const queryClientInstance = useQueryClient();
  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getCurrentUser(apiUrl("/api/v1/me")),
  });

  const signOutMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean }>("/api/v1/auth/logout", {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClientInstance.invalidateQueries({ queryKey: ["me"] });
      window.location.assign("/");
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: userQuery.data?.user ?? null,
      connections: userQuery.data?.connections ?? {
        githubConnected: false,
        wakatimeConnected: false,
      },
      isLoading: userQuery.isLoading,
      isAuthenticated: Boolean(userQuery.data?.user),
      signOut: async () => {
        await signOutMutation.mutateAsync();
      },
    }),
    [
      signOutMutation,
      userQuery.data?.connections,
      userQuery.data?.user,
      userQuery.isLoading,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthStateProvider>{children}</AuthStateProvider>
    </QueryClientProvider>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const publicRoutes = ["/", "/auth", "/auth/callback"];

  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const isPrivateRoute = location.pathname.startsWith("/app");
  const isOnboardRoute = location.pathname.startsWith("/onboard");
  const needsOnboarding = Boolean(user && user.onboardState < 1);

  if (isLoading) {
    return <LoadingPage label="Checking session" />;
  }

  if (!isAuthenticated && (isPrivateRoute || isOnboardRoute)) {
    return <Navigate to="/" replace />;
  }

  if (isAuthenticated && needsOnboarding && !isOnboardRoute) {
    return <Navigate to="/onboard" replace />;
  }

  if (isAuthenticated && !needsOnboarding && isPublicRoute) {
    return <Navigate to="/app" replace />;
  }

  return children;
}

export function loginWithProvider(provider: "github" | "google") {
  window.location.assign(apiUrl(`/api/v1/auth/${provider}/login`));
}
