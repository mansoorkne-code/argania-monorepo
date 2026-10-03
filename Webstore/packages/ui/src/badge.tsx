import { type HTMLAttributes } from "react";

export type BadgeVariant = "default" | "secondary" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={["ui-badge", `ui-badge--${variant}`, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
