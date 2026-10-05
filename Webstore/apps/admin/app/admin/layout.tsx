import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "./admin-shell";
import { createClient } from "../../lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=%2Fadmin");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !["admin", "manager"].includes(profile.role)
  ) {
    redirect("/login?error=unauthorized");
  }

  return (
    <AdminShell
      email={user.email ?? ""}
      name={profile.full_name?.trim() || user.email?.split("@")[0] || "Admin"}
      role={profile.role}
    >
      {children}
    </AdminShell>
  );
}
