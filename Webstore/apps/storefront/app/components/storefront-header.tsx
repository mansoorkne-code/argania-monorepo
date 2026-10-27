import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import { HeaderSearch } from "./header-search";
import { MobileNavigation } from "./mobile-navigation";
import { CartButton } from "../cart/cart-provider";

import { getStorefrontAssetUrl } from "../../lib/storefront-assets";

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

export async function StorefrontHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  return (
    <>
      <div className="announcement">
        <span className="announcement-accent" aria-hidden="true">
          ✦
        </span>
        <span>Complimentary delivery on orders over ₹2,500</span>
        <span className="announcement-dot" aria-hidden="true">
          •
        </span>
        <span>Thoughtfully crafted care, made for you</span>
        <span
          className={`$"announcement-accent" $"last-accent"`}
          aria-hidden="true"
        >
          ✦
        </span>
      </div>
      <header className="site-header">
        <div className="header-inner container-xl">
          <Link
            aria-label="Argania Professional home"
            className="brand"
            href="/"
          >
            <img
              src={getStorefrontAssetUrl("assets/logo-secondary.webp")}
              alt="Argania Professional"
              className="brand-logo"
            />
          </Link>

          <nav aria-label="Primary navigation" className="nav-left">
            <Link className="nav-link" href="/products">
              Shop all
            </Link>
            <Link className="nav-link" href="/products?category=haircare">
              Haircare
            </Link>
            <Link className="nav-link" href="/products?category=skincare">
              Skincare
            </Link>
          </nav>

          <nav aria-label="Secondary navigation" className="nav-right">
            <Link className="nav-link" href="/products?category=bodycare">
              Body care
            </Link>
            <Link className="nav-link" href="/about">
              About Us
            </Link>
            <Link className="nav-link" href="/#contact">
              Contact
            </Link>
          </nav>

          <div className="header-actions">
            <HeaderSearch />
            <Link
              aria-label="Wishlist"
              title="Wishlist"
              className="icon-button action-link"
              href="/account"
            >
              <WishlistIcon />
            </Link>
            <CartButton />
          </div>
          <MobileNavigation>
            <Link href="/">Home</Link>
            <Link className="nav-link" href="/products">
              Shop all
            </Link>
            <Link className="nav-link" href="/products?category=haircare">
              Haircare
            </Link>
            <Link className="nav-link" href="/products?category=skincare">
              Skincare
            </Link>
            <Link className="nav-link" href="/products?category=bodycare">
              Body care
            </Link>
            <Link className="nav-link" href="/about">
              About Us
            </Link>
            <a href="mailto:argania.professional@gmail.com?subject=B2B%20%2F%20Wholesale">
              B2B / Wholesale
            </a>
            <Link href="/#contact">Contact us</Link>
            <Link href={signedIn ? "/account" : "/login"}>
              {signedIn ? "Account" : "Sign in"}
            </Link>
          </MobileNavigation>
        </div>
      </header>
    </>
  );
}
