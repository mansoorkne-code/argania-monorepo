import Link from "next/link";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { ErrorState } from "@repo/ui/error-state";
import { safeNextPath } from "../../lib/auth/redirect";
import styles from "./page.module.css";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={styles.googleMark}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.39 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
        transform="translate(0 4)"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.39 38.06 46.98 31.93 46.98 24.55Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.44 14.44 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.88 23.88 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
        transform="translate(0 4)"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
        transform="translate(0 -4)"
      />
    </svg>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next ?? null);

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <CardHeader className={styles.cardHeader}>
          <span className={styles.kicker}>Welcome to Argania</span>
          <CardTitle className={styles.title}>A softer start.</CardTitle>
          <CardDescription className={styles.description}>
            Sign in or create an account to keep your everyday essentials close.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          {params.error === "google_sign_in_failed" ? (
            <ErrorState
              className={styles.error}
              description="Google sign-in could not be completed. Please try again."
              title="Sign-in didn’t work"
            />
          ) : null}
          <form action="/auth/sign-in" method="post">
            <input name="next" type="hidden" value={next} />
            <Button
              className={styles.googleButton}
              size="lg"
              type="submit"
              variant="outline"
            >
              <GoogleMark />
              Continue with Google
            </Button>
          </form>
          <p className={styles.terms}>
            By continuing, you agree to use your Google account to sign in to
            Argania.
          </p>
          <Link className={styles.backLink} href="/">
            Back to the storefront
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
