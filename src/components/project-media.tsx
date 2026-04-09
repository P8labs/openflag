type ProjectMediaProps = {
  title: string;
  image?: string | null;
  video?: string | null;
  className?: string;
};

export function ProjectMedia({
  title,
  image,
  video,
  className,
}: ProjectMediaProps) {
  if (video) {
    return (
      <div
        className={`relative overflow-hidden rounded-xs border border-border bg-surface ${className ?? ""}`.trim()}
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
        className={`relative overflow-hidden rounded-xs border border-border bg-surface ${className ?? ""}`.trim()}
      >
        <img alt={title} className="h-full w-full object-cover" src={image} />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xs border border-border bg-surface ${className ?? ""}`.trim()}
    >
      <div className="flex h-full flex-col justify-between p-4 text-foreground/80">
        <span className="w-fit rounded-xs border border-border bg-surface px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
          No preview yet
        </span>

        <div>
          <p className="line-clamp-2 text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs text-muted">
            Add an image or short demo video to improve the post.
          </p>
        </div>
      </div>
    </div>
  );
}
