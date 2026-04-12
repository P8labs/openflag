type FeedBoundaryProps = {
  postsLoading: boolean;
  projectsLoading: boolean;
  postsErrorMessage: string | null;
  projectsErrorMessage: string | null;
  feedLength: number;
};

export function FeedBoundary({
  postsLoading,
  projectsLoading,
  postsErrorMessage,
  projectsErrorMessage,
  feedLength,
}: FeedBoundaryProps) {
  const isLoading = postsLoading && projectsLoading;
  const hasAnyError = Boolean(postsErrorMessage || projectsErrorMessage);

  if (isLoading) {
    return (
      <p className="py-4 text-sm text-muted-foreground">Loading feed...</p>
    );
  }

  if (feedLength === 0 && hasAnyError) {
    return (
      <div className="space-y-2 py-3">
        {postsErrorMessage ? (
          <p className="text-sm text-destructive">
            Posts unavailable: {postsErrorMessage}
          </p>
        ) : null}
        {projectsErrorMessage ? (
          <p className="text-sm text-destructive">
            Projects unavailable: {projectsErrorMessage}
          </p>
        ) : null}
      </div>
    );
  }

  if (feedLength === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Feed is empty. Start by sharing your first update.
      </p>
    );
  }

  if (!hasAnyError) {
    return null;
  }

  return (
    <div className="space-y-1 rounded-md border border-border/70 bg-background/40 px-3 py-2">
      {postsErrorMessage ? (
        <p className="text-xs text-destructive">
          Posts failed to refresh: {postsErrorMessage}
        </p>
      ) : null}
      {projectsErrorMessage ? (
        <p className="text-xs text-destructive">
          Projects failed to refresh: {projectsErrorMessage}
        </p>
      ) : null}
    </div>
  );
}
