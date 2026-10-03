import { type HTMLAttributes } from "react";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden="true" className={["ui-skeleton", className].filter(Boolean).join(" ")} {...props} />;
}
