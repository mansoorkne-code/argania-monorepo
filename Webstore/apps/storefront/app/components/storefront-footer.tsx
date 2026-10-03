import Link from "next/link";
import styles from "./storefront-shell.module.css";

export function StorefrontFooter() {
  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.footerMain}>
        <div className={styles.footerBrand}>
          <Link className={styles.footerLogo} href="/">argania</Link>
          <p>Make a little room for yourself.</p>
        </div>
        <div className={styles.footerLinks}>
          <div>
            <h2>Explore</h2>
            <Link href="/products">Shop all</Link>
            <Link href="/#our-approach">Our approach</Link>
            <Link href="/#journal">Journal</Link>
          </div>
          <div>
            <h2>Here to help</h2>
            <Link href="/account">Your account</Link>
            <Link href="/#contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} Argania</span>
        <span>Thoughtfully, every day.</span>
      </div>
    </footer>
  );
}
