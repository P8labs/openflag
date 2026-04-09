import { Chip } from "@heroui/react";

export function OnboardingBanner({
  detailsComplete,
  projectComplete,
}: {
  detailsComplete: boolean;
  projectComplete: boolean;
}) {
  if (detailsComplete && projectComplete) {
    return null;
  }

  const message = !detailsComplete
    ? "Finish interests, skills, availability, and collaboration preferences."
    : "Create your first project post to complete onboarding.";

  return (
    <div className="ui-panel-muted flex items-center justify-between gap-4 px-4 py-3 text-sm text-foreground/75">
      <div className="flex flex-wrap items-center gap-2">
        <Chip size="sm" variant="secondary">
          Onboarding
        </Chip>
        <span>{message}</span>
      </div>
    </div>
  );
}
