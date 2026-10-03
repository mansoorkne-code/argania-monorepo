import { type HTMLAttributes } from "react";

export type SeparatorProps = HTMLAttributes<HTMLHRElement>;

export function Separator({ className, ...props }: SeparatorProps) {
  return <hr className={["ui-separator", className].filter(Boolean).join(" ")} {...props} />;
}
