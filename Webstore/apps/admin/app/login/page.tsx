import type { Metadata } from "next";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Admin sign in",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
    signedOut?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next?.startsWith("/admin") ? params.next : "/admin";
  const message =
    params.error === "unauthorized"
      ? "This account does not have admin access."
      : params.error
        ? "Google sign in could not be completed. Please try again."
        : params.signedOut
          ? "You have been signed out."
          : null;

  return (
    <main className={styles.page}>
      <section aria-labelledby="admin-login-title" className={styles.card}>
        <span className={styles.brandMark} aria-hidden="true">
          A
        </span>
        <p className={styles.eyebrow}>Argania operations</p>
        <h1 id="admin-login-title">Admin sign in</h1>
        <p className={styles.description}>
          Sign in with an account that has an admin or manager profile role.
        </p>
        {message ? (
          <p className={styles.message} role="status">
            {message}
          </p>
        ) : null}
        <form action="/auth/sign-in" method="post">
          <input name="next" type="hidden" value={next} />
          <Button size="lg" type="submit">
            Continue with Google
          </Button>
        </form>
      </section>
    </main>
  );
}
