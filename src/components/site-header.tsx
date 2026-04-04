import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-sm font-medium tracking-[0.2em] text-foreground uppercase"
        >
          Openflag
        </Link>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link
            href="/explore"
            className="transition-colors hover:text-foreground"
          >
            Explore
          </Link>
          <Link
            href="/about"
            className="transition-colors hover:text-foreground"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
