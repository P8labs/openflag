import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export function CallbackPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <Card className="callback-card">
      <CardHeader>
        <Badge variant="soft">OAuth callback</Badge>
        <CardTitle>{isLoading ? "Confirming session" : "Signed out"}</CardTitle>
        <CardDescription>
          {isLoading
            ? "Fetching the session from the Go API."
            : "The callback finished, but no session was found."}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
