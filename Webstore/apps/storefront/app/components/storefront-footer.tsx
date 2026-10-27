import Link from "next/link";
import { getStorefrontAssetUrl } from "../../lib/storefront-assets";
import { NewsletterForm } from "./newsletter-form";

export function StorefrontFooter() {
  return (
    <footer className="footer" id="contact">
      <div className="newsletter-area">
        <div className="container">
          <div className="newsletter-grid">
            <div>
              <span className="eyebrow warm">A LITTLE MORE SELF-CARE</span>
              <h2>Good things in your inbox.</h2>
              <p>
                Beauty notes, new rituals, and the occasional little surprise.
              </p>
            </div>
            <NewsletterForm id="footer-newsletter-email" footer />
          </div>
        </div>
      </div>
      <div className="container footer-body">
        <div className="footer-identity">
          <Link href="/" aria-label="Argania Professional home">
            <img
              src={getStorefrontAssetUrl("assets/logo-secondary.webp")}
              alt="Argania Professional"
              className="footer-brand-image"
            />
          </Link>
          <p>For the little moments that make you feel like yourself.</p>
          <span className="footer-motto">Nourish. Rejuvenate. Pamper.</span>
        </div>

        <nav aria-label="Explore" className="footer-column">
          <h4>Explore</h4>
          <Link href="/products">Shop all</Link>
          <Link href="/products?category=haircare">Haircare</Link>
          <Link href="/products?category=skincare">Skincare</Link>
          <Link href="/products?category=bodycare">Body care</Link>
        </nav>

        <nav aria-label="About Argania" className="footer-column">
          <h4>About Argania</h4>
          <Link href="/about">Our philosophy</Link>
          <a href="mailto:argania.professional@gmail.com">Contact us</a>
        </nav>

        <nav aria-label="Policies and support" className="footer-column">
          <h4>Policies &amp; Support</h4>
          <a href="mailto:argania.professional@gmail.com">Customer support</a>
        </nav>

        <div className="footer-column footer-connect">
          <h4>Connect &amp; Collaborate</h4>
          <a
            className="footer-social-link"
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
            className="footer-b2b-link"
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

      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Argania Professional. A more beautiful
          everyday.
        </span>
        <span>Made with care, for your care. ✳</span>
      </div>
    </footer>
  );
}
