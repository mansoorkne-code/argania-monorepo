"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { signOut } from "../actions";
import {
  adminNavigation,
  getAdminNavigationItem,
} from "../../lib/admin-navigation";
import styles from "./admin-shell.module.css";

type AdminShellProps = {
  children: ReactNode;
  email: string;
  name: string;
  role: string;
};

const iconPaths: Record<(typeof adminNavigation)[number]["icon"], string> = {
  dashboard: "M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z",
  orders: "M5 3h14v18l-2-1-2 1-2-1-2 1-2-1-2 1-2-1zm3 5h8m-8 4h8m-8 4h5",
  products: "m12 3 9 5-9 5-9-5zm-9 5v9l9 5 9-5V8m-9 5v9",
  categories: "M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z",
  coupons: "M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6zm8 2v2m0 2v2m0 2v2",
  customers:
    "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m6-7a4 4 0 0 1 0 7m2 4a4 4 0 0 1 2 4v2",
  payments: "M3 5h18v14H3zm0 4h18m-14 5h4",
  analytics: "M3 3v18h18M8 15l4-4 3 3 6-7",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0-5v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0-1.42-1.42M7.06 7.06 5.64 5.64",
};

function NavigationIcon({
  icon,
}: {
  icon: (typeof adminNavigation)[number]["icon"];
}) {
  return (
    <svg
      aria-hidden="true"
      className={styles.navIcon}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d={iconPaths[icon]}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function getBreadcrumbs(pathname: string) {
  const item = getAdminNavigationItem(pathname);
  const crumbs = [{ label: "Dashboard", href: "/admin" }];
  if (item.href !== "/admin")
    crumbs.push({ label: item.label, href: item.href });
  if (pathname !== item.href) crumbs.push({ label: "Details", href: pathname });
  return { item, crumbs };
}

export function AdminShell({ children, email, name, role }: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { item, crumbs } = getBreadcrumbs(pathname);
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className={styles.frame}>
      {menuOpen ? (
        <button
          aria-label="Close navigation"
          className={styles.backdrop}
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      ) : null}
      <aside
        aria-label="Admin sidebar"
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
        id="admin-sidebar"
      >
        <Link
          aria-label="Argania admin dashboard"
          className={styles.brand}
          href="/admin"
        >
          <span aria-hidden="true" className={styles.brandMark}>
            A
          </span>
          <span className={styles.brandText}>
            <strong>Argania</strong>
            <small>ADMIN CONSOLE</small>
          </span>
        </Link>

        <p className={styles.navLabel}>Workspace</p>
        <nav aria-label="Admin navigation" className={styles.navigation}>
          {adminNavigation.map((navItem) => {
            const active = item.href === navItem.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                href={navItem.href}
                key={navItem.href}
                onClick={() => setMenuOpen(false)}
              >
                <NavigationIcon icon={navItem.icon} />
                <span>{navItem.label}</span>
                {active ? (
                  <span aria-hidden="true" className={styles.activeMark} />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.statusDot} />
          <span>Store operations</span>
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <button
              aria-controls="admin-sidebar"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              className={styles.menuToggle}
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
            <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
              {crumbs.map((crumb, index) => (
                <span className={styles.crumb} key={`${crumb.href}-${index}`}>
                  {index > 0 ? (
                    <span aria-hidden="true" className={styles.crumbSeparator}>
                      /
                    </span>
                  ) : null}
                  {index === crumbs.length - 1 ? (
                    <span aria-current="page">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href}>{crumb.label}</Link>
                  )}
                </span>
              ))}
            </nav>
            <h1>{item.label}</h1>
          </div>

          <details className={styles.profileMenu}>
            <summary aria-label={`Admin profile menu for ${name}`}>
              <span aria-hidden="true" className={styles.avatar}>
                {initials || "A"}
              </span>
              <span className={styles.profileCopy}>
                <strong>{name}</strong>
                <small>
                  {role === "manager" ? "Manager" : "Administrator"}
                </small>
              </span>
              <svg
                aria-hidden="true"
                className={styles.chevron}
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="m4 6 4 4 4-4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <div className={styles.profileDropdown}>
              <span className={styles.profileEmail}>{email}</span>
              <form action={signOut}>
                <button className={styles.signOutButton} type="submit">
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M8 3H4v14h4m4-3 4-4-4-4m4 4H7"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                  Sign out
                </button>
              </form>
            </div>
          </details>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
