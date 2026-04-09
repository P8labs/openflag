"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppViewer = {
  session: {
    user: {
      id: string;
      name: string;
      image: string | null;
      email?: string;
    };
  } | null;
  profile: {
    username: string;
    avatar: string | null;
    onboardingComplete: boolean;
  } | null;
};

const AppViewerContext = createContext<AppViewer | null>(null);

function isProtectedPath(pathname: string) {
  return [
    "/feed",
    "/projects",
    "/matches",
    "/notifications",
    "/post-project",
    "/settings",
    "/profile",
  ].some((prefix) => pathname.startsWith(prefix));
}

function SessionProfileGate({ viewer }: { viewer: AppViewer }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isProtected = isProtectedPath(pathname);

    if (!viewer.session && isProtected) {
      router.replace("/auth");
      return;
    }

    if (viewer.session && pathname.startsWith("/auth")) {
      if (viewer.profile?.onboardingComplete) {
        router.replace("/feed");
      } else {
        router.replace("/onboarding");
      }
      return;
    }

    if (
      viewer.session &&
      !viewer.profile?.onboardingComplete &&
      isProtected &&
      !pathname.startsWith("/onboarding")
    ) {
      router.replace("/onboarding");
      return;
    }

    if (
      viewer.session &&
      viewer.profile?.onboardingComplete &&
      pathname.startsWith("/onboarding")
    ) {
      router.replace("/feed");
    }
  }, [pathname, router, viewer]);

  return null;
}

export function useAppViewer() {
  const context = useContext(AppViewerContext);
  if (!context) {
    throw new Error("useAppViewer must be used inside Providers");
  }

  return context;
}

export function Providers({
  children,
  initialViewer,
}: {
  children: ReactNode;
  initialViewer: AppViewer;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            gcTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  const viewerValue = useMemo(() => initialViewer, [initialViewer]);

  return (
    <AppViewerContext.Provider value={viewerValue}>
      <QueryClientProvider client={queryClient}>
        <SessionProfileGate viewer={viewerValue} />
        {children}
      </QueryClientProvider>
    </AppViewerContext.Provider>
  );
}
