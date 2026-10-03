import { type ReactNode } from "react";

export interface ErrorStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <section
      aria-live="polite"
      className={["ui-state", "ui-error-state", className].filter(Boolean).join(" ")}
      role="alert"
    >
      <h2 className="ui-state__title">{title}</h2>
      {description ? <p className="ui-state__description">{description}</p> : null}
      {action ? <div className="ui-state__action">{action}</div> : null}
    </section>
  );
}
