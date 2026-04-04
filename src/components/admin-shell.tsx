import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { label: "Software", href: "/admin/software" },
  { label: "Runs", href: "/admin/software?status=PROCESSING" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 border-r border-border/70 px-6 py-6 md:flex md:flex-col">
          <Link
            href="/admin/software"
            className="text-sm font-medium tracking-[0.22em] uppercase"
          >
            Openflag Admin
          </Link>

          <Separator className="my-6" />

          <nav className="space-y-1 text-sm">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border/70 px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Admin Panel
              </p>
              <h1 className="text-sm font-medium text-foreground">
                Minimal software control surface
              </h1>
            </div>

            <Button
              asChild
              variant="outline"
              className="rounded-full border-border/70 bg-background shadow-none"
            >
              <Link href="/api/admin/logout">Logout</Link>
            </Button>
          </header>

          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
