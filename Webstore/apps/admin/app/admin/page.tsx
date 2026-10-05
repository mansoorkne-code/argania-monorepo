import Link from "next/link";
import { adminNavigation } from "../../lib/admin-navigation";
import styles from "./page.module.css";

const quickLinks = adminNavigation.filter((item) =>
  ["Orders", "Products", "Categories", "Customers"].includes(item.label),
);

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <span className={styles.kicker}>Store overview</span>
        <h2>Welcome to your workspace.</h2>
        <p>Choose an area to manage the Argania store.</p>
      </section>
      <section aria-label="Quick links" className={styles.quickLinks}>
        {quickLinks.map((item) => (
          <Link className={styles.quickCard} href={item.href} key={item.href}>
            <span>{item.label}</span>
            <span aria-hidden="true" className={styles.arrow}>
              ↗
            </span>
            <small>Open {item.label.toLowerCase()}</small>
          </Link>
        ))}
      </section>
    </div>
  );
}
