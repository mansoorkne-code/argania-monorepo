import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import styles from "./storefront-shell.module.css";

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      className={styles.brandMark}
      viewBox="0 0 32 32"
      fill="none"
    >
      <path d="M16 28C7 22 5 11 15 4c8 7 10 17 1 24Z" fill="currentColor" />
      <path
        d="M8 20c5 0 10 2 14 6M16 8c1 7 1 12 0 18"
        stroke="var(--shell-header)"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle
        cx="10.8"
        cy="10.8"
        r="6.8"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m16 16 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 8h14l1 12H4L5 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 9V6a3 3 0 0 1 6 0v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export async function StorefrontHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  return (
    <>
      <div className={styles.announcement}>
        <p>A little more care, built into your everyday.</p>
      </div>
      <header className={styles.header}>
        <Link aria-label="Argania home" className={styles.brand} href="/">
          <BrandMark />
          <span>argania</span>
        </Link>

        <nav aria-label="Main navigation" className={styles.desktopNav}>
          <Link href="/products">Shop</Link>
          <Link href="/#our-approach">Our approach</Link>
          <Link href="/#journal">Journal</Link>
        </nav>

        <div className={styles.headerActions}>
          <Link
            aria-label="Search products"
            className={styles.iconLink}
            href="/products"
          >
            <SearchIcon />
          </Link>
          <Link
            className={styles.accountLink}
            href={signedIn ? "/account" : "/login"}
          >
            {signedIn ? "Account" : "Sign in"}
          </Link>
          <Link
            aria-label="Shopping bag"
            className={styles.iconLink}
            href="/cart"
          >
            <BagIcon />
          </Link>
          <details className={styles.mobileMenu}>
            <summary aria-label="Open navigation menu">
              <span />
              <span />
            </summary>
            <nav aria-label="Mobile navigation" className={styles.mobileNav}>
              <Link href="/products">Shop</Link>
              <Link href="/#our-approach">Our approach</Link>
              <Link href="/#journal">Journal</Link>
              <Link href={signedIn ? "/account" : "/login"}>
                {signedIn ? "Account" : "Sign in"}
              </Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
