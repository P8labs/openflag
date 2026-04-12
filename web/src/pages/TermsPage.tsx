import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto w-full max-w-4xl px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo size="sm" />
          <span className="text-sm font-medium">Openflag</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/policy" className="hover:text-foreground transition">
            Privacy
          </Link>
          <Link to="/auth" className="hover:text-foreground transition">
            Login
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-4xl px-4 py-10 flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: April 12, 2026
          </p>
        </div>

        <article className="flex flex-col gap-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {[
            {
              title: "Acceptance",
              body: "By using Openflag, you agree to these terms and the basic rules of the platform. If you do not agree, you should not use the service.",
            },
            {
              title: "User content and proof",
              body: "You own the content you post. When you link GitHub, Wakatime, or other proof, you confirm that it represents your actual work. Misleading or fake proof may lead to account action.",
            },
            {
              title: "Use of platform",
              body: "Openflag is built for showcasing real work and collaboration. You should not use it for spam, harassment, illegal activity, or posting irrelevant or low-effort content.",
            },
            {
              title: "Accounts and access",
              body: "You are responsible for your account. We may suspend or remove accounts that abuse the platform, violate rules, or harm other users or the system.",
            },
            {
              title: "External services",
              body: "Openflag may use third-party services like GitHub or Wakatime. We are not responsible for their availability or data accuracy.",
            },
            {
              title: "Liability",
              body: 'Openflag is provided "as is". We do not guarantee uninterrupted service and are not liable for any indirect or unexpected losses from using the platform.',
            },
          ].map((section) => (
            <section key={section.title} className="flex flex-col gap-1">
              <h2 className="text-sm font-medium text-foreground sm:text-base">
                {section.title}
              </h2>
              <p>{section.body}</p>
            </section>
          ))}
        </article>
      </section>
    </main>
  );
}
