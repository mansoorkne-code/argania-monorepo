import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function getProductAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=%2Fadmin%2Fproducts");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !["admin", "manager"].includes(profile.role)
  ) {
    redirect("/login?error=unauthorized");
  }

  return { supabase, user, role: profile.role as "admin" | "manager" };
}

export async function requireProductAdmin() {
  const access = await getProductAccess();
  if (access.role !== "admin") {
    redirect("/admin/products?error=forbidden");
  }
  return access.supabase;
}
