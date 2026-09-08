import { clearAuthCookie, safeReturnPath, sessionCookie } from "@/lib/oauth-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return new Response(null, { status: 302, headers: { Location: new URL(safeReturnPath(url.searchParams.get("return_to")), url.origin).toString(), "Set-Cookie": clearAuthCookie(sessionCookie, request.url) } });
}
