import Link from "next/link";
import { getStorefrontAssetUrl } from "../../lib/storefront-assets";
import styles from "./storefront-footer.module.css";

export function StorefrontFooter() {
  return (
    <footer className={styles.footer} id="contact">
      <div className={`${styles.container} ${styles.footerBody}`}>
        <div className={styles.footerIdentity}>
          <Link href="/" aria-label="Argania Professional home">
            <img
              src={getStorefrontAssetUrl("assets/logo-secondary.webp")}
              alt="Argania Professional"
            />
          </Link>
          <p>For the little moments that make you feel like yourself.</p>
          <span className={styles.footerMotto}>
            Nourish. Rejuvenate. Pamper.
          </span>
        </div>

        <nav aria-label="Explore" className={styles.footerColumn}>
          <h2>Explore</h2>
          <Link href="/products">Shop all</Link>
          <Link href="/products?category=haircare">Haircare</Link>
          <Link href="/products?category=skincare">Skincare</Link>
          <Link href="/products?category=body-care">Body care</Link>
        </nav>

        <nav aria-label="About Argania" className={styles.footerColumn}>
          <h2>About Argania</h2>
          <Link href="/about">Our philosophy</Link>
          <a href="mailto:argania.professional@gmail.com">Contact us</a>
          <Link href="/account">Your wishlist</Link>
          <a
            href="https://www.arganiaprofessional.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Current store ↗
          </a>
        </nav>

        <nav aria-label="Policies and support" className={styles.footerColumn}>
          <h2>Policies &amp; Support</h2>
          <a
            href="https://www.arganiaprofessional.com/policies/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms &amp; Conditions
          </a>
          <a
            href="https://www.arganiaprofessional.com/policies/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Our Policy
          </a>
          <a
            href="https://www.arganiaprofessional.com/policies/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Live Privacy Policy ↗
          </a>
          <a href="mailto:argania.professional@gmail.com">Customer support</a>
        </nav>

        <div className={`${styles.footerColumn} ${styles.connect}`}>
          <h2>Connect &amp; Collaborate</h2>
          <a
            className={styles.socialLink}
            href="https://www.instagram.com/argania.pro/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Argania Professional on Instagram"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle
                cx="17.7"
                cy="6.6"
                r="1"
                fill="currentColor"
                stroke="none"
              />
            </svg>
            <span>Instagram · @argania.pro ↗</span>
          </a>
          <a
            className={styles.b2bLink}
            href="mailto:argania.professional@gmail.com?subject=B2B%20%2F%20Bulk%20enquiry"
          >
            B2B / Bulk Enquiries ↗
          </a>
          <a href="mailto:argania.professional@gmail.com">
            argania.professional@gmail.com
          </a>
          <span>Delhi, India</span>
        </div>
      </div>

      <div className={`${styles.container} ${styles.footerBottom}`}>
        <span>
          © {new Date().getFullYear()} Argania Professional. A more beautiful
          everyday.
        </span>
        <span>Made with care, for your care. ✳</span>
      </div>
    </footer>
  );
}
