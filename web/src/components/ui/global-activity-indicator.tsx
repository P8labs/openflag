import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export function GlobalActivityIndicator() {
  const activeQueries = useIsFetching();
  const activeMutations = useIsMutating();
  const isActive = activeQueries + activeMutations > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;

    if (isActive) {
      timeoutId = window.setTimeout(() => {
        setVisible(true);
      }, 120);
    } else {
      setVisible(false);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isActive]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-3 right-3 z-50"
      aria-hidden
    >
      <div className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
    </div>
  );
}
