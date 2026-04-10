export default function LoadingPage({
  label = "I forgot a semicolon… fixing it real quick",
}: {
  label?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(circle, var(--primary), transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <img
            src="/openflag.png"
            alt="OpenFlag"
            className="w-14 h-14 opacity-90"
          />

          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: "var(--primary)" }}
          />
        </div>

        <p className="text-sm text-muted-foreground tracking-wide text-center max-w-xs wrap-break-word">
          {label}
        </p>
      </div>
    </div>
  );
}
