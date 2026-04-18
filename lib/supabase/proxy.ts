import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh the session token and check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Auth guard rules
  if (!user) {
    // Unauthenticated: only allow / and /login
    if (pathname !== "/" && pathname !== "/login") {
      return NextResponse.redirect(
        new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url),
      );
    }
  } else {
    // Authenticated: read active_role cookie
    const activeRole = request.cookies.get("active_role")?.value;
    const isAdmin = activeRole === "管理员";

    // Already logged in visiting /login (GET navigation only) → redirect to home.
    // Server Action POST requests from /login must pass through, otherwise action response breaks.
    if (pathname === "/login" && request.method === "GET") {
      const homeUrl = isAdmin ? "/dashboard/overview" : "/mobile/assistant";
      return NextResponse.redirect(new URL(homeUrl, request.url));
    }

    // Non-admin accessing /dashboard/* → redirect to mobile
    if (pathname.startsWith("/dashboard") && !isAdmin) {
      return NextResponse.redirect(new URL("/mobile/assistant", request.url));
    }
  }

  return response;
}
