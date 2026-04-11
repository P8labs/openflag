import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";
import { loginWithProvider } from "@/context/auth-context";

export default function AuthPage() {
  return (
    <div className="flex items-center justify-center min-h-screen min-w-screen">
      <div className="w-full max-w-md">
        <div className="mb-6 space-y-3">
          <p className="text-2xl font-semibold leading-tight">
            Let you Join <br /> Something exciting
          </p>

          <p className="text-sm text-muted-foreground leading-relaxed">
            By continuing, you agree to our
            <Link className="text-primary hover:underline mx-1" to="/terms">
              Terms
            </Link>
            and
            <Link className="text-primary hover:underline mx-1" to="/privacy">
              Privacy Policy
            </Link>
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-md rounded-b-none bg-black hover:bg-black/80 transition-colors text-white hover:text-white/90 h-18 text-xl space-x-1 flex justify-between items-center px-6 font-mono border-0"
            onClick={() => loginWithProvider("github")}
          >
            Continue with Github
            <FaGithub className="size-7" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full rounded-md rounded-t-none h-18 text-xl space-x-1 flex justify-between items-center px-6 font-mono bg-white! hover:bg-gray-100! text-black! transition-colors border border-t-0"
            onClick={() => loginWithProvider("google")}
          >
            Continue with Google
            <FcGoogle className="size-7" />
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-4 emoji">
          Shh... this is where it starts 🤫
        </p>
      </div>
    </div>
  );
}
