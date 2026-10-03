import { type LabelHTMLAttributes } from "react";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={["ui-label", className].filter(Boolean).join(" ")} {...props} />;
}
