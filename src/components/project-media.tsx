type ProjectMediaProps = {
  title: string;
  image?: string | null;
  video?: string | null;
  className?: string;
};

const fallbackGradients = [
  "from-amber-200 via-orange-100 to-pink-100 dark:from-amber-900/40 dark:via-orange-900/20 dark:to-pink-900/30",
  "from-sky-200 via-cyan-100 to-emerald-100 dark:from-sky-900/40 dark:via-cyan-900/20 dark:to-emerald-900/30",
  "from-violet-200 via-indigo-100 to-blue-100 dark:from-violet-900/40 dark:via-indigo-900/20 dark:to-blue-900/30",
  "from-rose-200 via-fuchsia-100 to-purple-100 dark:from-rose-900/40 dark:via-fuchsia-900/20 dark:to-purple-900/30",
];

function pickGradient(seed: string) {
  const value = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbackGradients[value % fallbackGradients.length];
}

export function ProjectMedia({
  title,
  image,
  video,
  className,
}: ProjectMediaProps) {
  if (video) {
    return (
      <div
        className={`relative overflow-hidden rounded-[20px] bg-black ${className ?? ""}`.trim()}
      >
        <video
          autoPlay
          className="h-full w-full object-cover"
          loop
          muted
          playsInline
          src={video}
        />
      </div>
    );
  }

  if (image) {
    return (
      <div
        className={`relative overflow-hidden rounded-[20px] bg-black ${className ?? ""}`.trim()}
      >
        <img alt={title} className="h-full w-full object-cover" src={image} />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] bg-gradient-to-br ${pickGradient(title)} ${className ?? ""}`.trim()}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.25),transparent_45%)]" />
      <div className="absolute inset-0 p-4">
        <div className="flex h-full flex-col justify-between rounded-[16px] border border-black/10 bg-black/10 p-3 text-black/75 backdrop-blur-[1px] dark:border-white/20 dark:bg-black/20 dark:text-white/85">
          <span className="w-fit rounded-full border border-black/20 bg-black/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] dark:border-white/25 dark:bg-white/10">
            No preview yet
          </span>

          <div>
            <p className="line-clamp-2 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs opacity-80">
              Add an image or short demo video to improve swipe conversions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
