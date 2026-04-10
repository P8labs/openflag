import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-screen">
      <section className="flex items-center justify-center flex-col space-y-2">
        <p className="text-muted-foreground font-semibold">
          WRONG TURN <b className="underline">404</b>
        </p>
        <span className="text-sm text-muted-foreground mb-5">
          Sorry we don't have google maps integration???
        </span>
        <div className="space-x-2">
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go back
          </Button>
        </div>
      </section>
    </div>
  );
}
