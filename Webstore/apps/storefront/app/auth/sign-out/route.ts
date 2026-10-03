import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest } from "../../../lib/auth/request";
import { createClient } from "../../../lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "A same-origin request is required." },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url), 303);
}
