import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import { StickyHeaderContainer } from "./sticky-header-container";
import styles from "./storefront-shell.module.css";
import { getStorefrontAssetUrl } from "../../lib/storefront-assets";

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

function WishlistIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"
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
        <p>
          <span className={styles.announcementAccent} aria-hidden="true">
            ✦
          </span>
          <span>Complimentary delivery on orders over ₹2,500</span>
          <span className={styles.announcementDot} aria-hidden="true">
            •
          </span>
          <span>Thoughtfully crafted care, made for you</span>
          <span
            className={`${styles.announcementAccent} ${styles.lastAccent}`}
            aria-hidden="true"
          >
            ✦
          </span>
        </p>
      </div>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <details className={styles.mobileMenu}>
            <summary aria-label="Open navigation menu">
              <span />
              <span />
              <span />
            </summary>
            <nav aria-label="Mobile navigation" className={styles.mobileNav}>
              <Link href="/">Home</Link>
              <Link href="/products">Shop all</Link>
              <Link href="/products?category=haircare">Haircare</Link>
              <Link href="/products?category=skincare">Skincare</Link>
              <Link href="/products?category=body-care">Body care</Link>
              <Link href="/about">About us</Link>
              <a href="mailto:argania.professional@gmail.com?subject=B2B%20%2F%20Wholesale">
                B2B / Wholesale
              </a>
              <Link href="/#contact">Contact us</Link>
              <Link href={signedIn ? "/account" : "/login"}>
                {signedIn ? "Account" : "Sign in"}
              </Link>
            </nav>
          </details>

          <Link
            aria-label="Argania Professional home"
            className={styles.brand}
            href="/"
          >
            <img
              src={getStorefrontAssetUrl("assets/logo-secondary.webp")}
              alt="Argania Professional"
              className={styles.brandImage}
            />
          </Link>

          <nav
            aria-label="Primary navigation"
            className={`${styles.desktopNav} ${styles.navLeft}`}
          >
            <Link href="/products">Shop all</Link>
            <Link href="/products?category=haircare">Haircare</Link>
            <Link href="/products?category=skincare">Skincare</Link>
          </nav>

          <nav
            aria-label="Secondary navigation"
            className={`${styles.desktopNav} ${styles.navRight}`}
          >
            <Link href="/products?category=body-care">Body care</Link>
            <Link href="/about">About us</Link>
            <Link href="/#contact">Contact</Link>
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
              aria-label="Wishlist"
              title="Wishlist"
              className={styles.iconLink}
              href="/account"
            >
              <WishlistIcon />
            </Link>
            <Link
              aria-label="Shopping bag"
              className={styles.iconLink}
              href="/cart"
            >
              <BagIcon />
            </Link>
          </div>
        </div>
      </header>
    </StickyHeaderContainer>
  );
}
