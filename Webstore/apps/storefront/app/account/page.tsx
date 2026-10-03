import { redirect } from "next/navigation";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { createClient } from "../../lib/supabase/server";
import styles from "./page.module.css";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const claims = data?.claims;
  if (error || !claims?.sub) {
    redirect("/login?next=%2Faccount");
  }

  const email =
    typeof claims.email === "string" ? claims.email : "Google account";

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <Badge className={styles.badge} variant="success">
            Signed in
          </Badge>
          <CardTitle className={styles.title}>Your Argania account</CardTitle>
          <CardDescription>{email}</CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          <p>
            Your account is ready. Order history and saved details will appear
            here as those features are added.
          </p>
          <form action="/auth/sign-out" method="post">
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
