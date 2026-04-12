import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function PolicyPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto w-full max-w-4xl px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo size="sm" />
          <span className="text-sm font-medium">Openflag</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition">
            Terms
          </Link>
          <Link to="/auth" className="hover:text-foreground transition">
            Login
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-4xl px-4 py-10 flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: April 12, 2026
          </p>
        </div>

        <article className="flex flex-col gap-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {[
            {
              title: "Information we collect",
              body: "When you sign in, we collect basic profile data from GitHub or Google such as name, email, and avatar. You may also provide additional information like bio, skills, interests, and project details.",
            },
            {
              title: "Work and activity data",
              body: "If you link GitHub or Wakatime, we may store limited information such as repository links, pull requests, issues, and time logs to support the proof-of-work system.",
            },
            {
              title: "How we use your data",
              body: "Your data is used to create your profile, display your work, and help others discover you and your projects. We do not use your data for advertising or sell it to third parties.",
            },
            {
              title: "Public content",
              body: "Posts, projects, and profile information you choose to share are visible to other users. Do not post sensitive information you do not want to be public.",
            },
            {
              title: "Third-party services",
              body: "Authentication and some data come from third-party services like GitHub, Google, and Wakatime. Their privacy policies also apply when you use those integrations.",
            },
            {
              title: "Data control",
              body: "You can update or remove your profile information at any time. If you delete your account, your personal data will be removed, except where retention is required for system integrity or legal reasons.",
            },
            {
              title: "Security",
              body: "We take reasonable measures to protect your data, but no system is completely secure. Use the platform responsibly.",
            },
            {
              title: "Contact",
              body: "If you have any questions, issues, or requests related to your data, you can contact us at support@openflag.xyz.",
            },
            {
              title: "Changes",
              body: "This policy may be updated over time. Continued use of Openflag means you accept any changes.",
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
