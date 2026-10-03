import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "../../../lib/auth/redirect";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");

  if (!code || searchParams.has("error")) {
    return NextResponse.redirect(
      new URL("/login?error=google_sign_in_failed", request.url),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=google_sign_in_failed", request.url),
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
