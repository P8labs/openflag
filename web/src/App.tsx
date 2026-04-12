import { BrowserRouter, Route, Routes } from "react-router-dom";

import {
  AuthPage,
  CreatePostPage,
  CreateProjectPage,
  EditProjectPage,
  HomePage,
  LandingPage,
  ManageProjectsPage,
  ManifestoPage,
  NotFoundPage,
  NotificationsPage,
  OnboardPage,
  ProjectDetailPage,
  UserProfilePage,
} from "./pages";

import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/context/auth-context";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import appConfig from "./lib/config";
import ExplorePage from "./pages/ExplorePage";
import GalaxyPage from "./pages/GalaxyPage";
import { CallbackPage } from "./pages/misc/AuthCallback";

export default function App() {
  if (appConfig.MANIFESTO_MODE) {
    return <ManifestoPage />;
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthGate>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<CallbackPage />} />
            <Route path="/onboard" element={<OnboardPage />} />
            <Route path="/app" element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="projects" element={<ManageProjectsPage />} />
              <Route path="projects/compose" element={<CreateProjectPage />} />
              <Route
                path="projects/:projectId"
                element={<ProjectDetailPage />}
              />
              <Route
                path="projects/:projectId/edit"
                element={<EditProjectPage />}
              />
              <Route path="posts/compose" element={<CreatePostPage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="galaxy" element={<GalaxyPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
            <Route path=":username" element={<AppShell />}>
              <Route index element={<UserProfilePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </ThemeProvider>
  );
}
