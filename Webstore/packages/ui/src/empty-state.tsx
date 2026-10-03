import { type ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <section className={["ui-state", "ui-empty-state", className].filter(Boolean).join(" ")}>
      <h2 className="ui-state__title">{title}</h2>
      {description ? <p className="ui-state__description">{description}</p> : null}
      {action ? <div className="ui-state__action">{action}</div> : null}
    </section>
  );
}
