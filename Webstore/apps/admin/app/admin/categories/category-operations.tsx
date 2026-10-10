"use client";

import { useActionState } from "react";
import { Button } from "@repo/ui/button";
import type { CategoryFormState } from "../../../lib/categories";
import { changeCategoryStatusAction } from "./actions";
import styles from "./categories.module.css";

export function CategoryOperation({
  id,
  name,
  operation,
  disabled,
}: {
  id: string;
  name: string;
  operation: "archive" | "delete";
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(
    changeCategoryStatusAction.bind(null, id, operation),
    {},
  );
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const message =
          operation === "delete"
            ? `Permanently delete “${name}”? This cannot be undone.`
            : `Archive “${name}”? It will no longer appear in the storefront.`;
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <Button
        variant={operation === "delete" ? "destructive" : "outline"}
        size="sm"
        type="submit"
        disabled={disabled || pending}
      >
        {pending ? "Working…" : operation === "delete" ? "Delete" : "Archive"}
      </Button>
      {state.formError && (
        <p className={styles.error} role="alert">
          {state.formError}
        </p>
      )}
    </form>
  );
}
