import { OnboardStepForm } from "@/components/onboarding/onboard-step-form";

export default function OnboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen min-w-screen px-4 py-10">
      <div className="w-full max-w-md">
        <OnboardStepForm />

        <p className="text-xs text-center text-muted-foreground mt-4 emoji">
          This is where your profile starts ??
        </p>
      </div>
    </div>
  );
}
