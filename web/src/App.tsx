import { BrowserRouter, Route, Routes } from "react-router-dom";

import {
  AuthPage,
  HomePage,
  LandingPage,
  ManageProjectsPage,
  ManifestoPage,
  NotFoundPage,
  OnboardPage,
} from "./pages";

import { AppShell } from "@/components/AppShell";
import { CallbackPage } from "@/components/pages";
import { AuthGate } from "@/context/auth-context";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import appConfig from "./lib/config";

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
              <Route path="/app/projects" element={<ManageProjectsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </ThemeProvider>
  );
}
