import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import { StickyHeaderContainer } from "./sticky-header-container";
import styles from "./storefront-shell.module.css";

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

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="7"
        r="4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
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
    <StickyHeaderContainer>
      <div className={styles.announcement}>
        <p>A little more care, built into your everyday.</p>
      </div>
      <header className={styles.header}>
        <Link aria-label="Argania home" className={styles.brand} href="/">
          <img
            src="https://www.arganiaprofessional.com/cdn/shop/files/1.png"
            alt="Argania Professional"
            className={styles.brandImage}
          />
        </Link>

        <nav aria-label="Main navigation" className={styles.desktopNav}>
          <Link href="/">Home</Link>
          <Link href="/products">Catalogue</Link>
          <Link href="/#contact">Contact</Link>
          <Link href="/#about">About us</Link>
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
            aria-label={signedIn ? "Account" : "Sign in"}
            title={signedIn ? "Account" : "Sign in"}
            className={styles.iconLink}
            href={signedIn ? "/account" : "/login"}
          >
            <UserIcon />
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
              <Link href="/">Home</Link>
              <Link href="/products">Catalogue</Link>
              <Link href="/#contact">Contact</Link>
              <Link href="/#about">About us</Link>
              <Link href={signedIn ? "/account" : "/login"}>
                {signedIn ? "Account" : "Sign in"}
              </Link>
            </nav>
          </details>
        </div>
      </header>
    </StickyHeaderContainer>
  );
}
