"use client";
import { ErrorState } from "@repo/ui/error-state";
import { Button } from "@repo/ui/button";
export default function CategoryError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Unable to load category management"
      description="Please try again."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
