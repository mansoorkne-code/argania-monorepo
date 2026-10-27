"use client";
import { useRef, type ReactNode } from "react";
export function MobileNavigation({ children }: { children: ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);
  return (
    <details
      ref={details}
      className="mobile-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          details.current?.removeAttribute("open");
          details.current?.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label="Open navigation menu">
        <span />
        <span />
        <span />
      </summary>
      <nav
        className="mobile-nav"
        aria-label="Mobile navigation"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a"))
            details.current?.removeAttribute("open");
        }}
      >
        {children}
      </nav>
    </details>
  );
}
