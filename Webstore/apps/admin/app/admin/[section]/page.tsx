import { notFound } from "next/navigation";
import { adminNavigation } from "../../../lib/admin-navigation";
import styles from "../page.module.css";

type AdminSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function AdminSectionPage({
  params,
}: AdminSectionPageProps) {
  const { section } = await params;
  const item = adminNavigation.find(
    (candidate) => candidate.href === `/admin/${section}`,
  );
  if (!item || item.href === "/admin") notFound();

  return (
    <section className={styles.sectionPage}>
      <span className={styles.kicker}>Admin workspace</span>
      <h2>{item.label}</h2>
      <p>
        The {item.label.toLowerCase()} workspace is ready for its management
        tools.
      </p>
    </section>
  );
}
