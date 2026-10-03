import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "../../../lib/auth/redirect";
import { isSameOriginRequest } from "../../../lib/auth/request";
import { createClient } from "../../../lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "A same-origin request is required." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const candidate = formData.get("next");
  const next = safeNextPath(typeof candidate === "string" ? candidate : null);
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
