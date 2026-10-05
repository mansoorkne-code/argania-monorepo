import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function safeAdminPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/admin";
  if (value === "/admin" || value.startsWith("/admin/")) return value;
  return "/admin";
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "A same-origin request is required." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const next = safeAdminPath(formData.get("next"));
  const callbackUrl = new URL("/auth/callback", request.url);
  callbackUrl.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL("/login?error=google_sign_in_failed", request.url),
      303,
    );
  }

  return NextResponse.redirect(data.url, 303);
}
