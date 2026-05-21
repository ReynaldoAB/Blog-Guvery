import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

function getGoogleAuthConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  };
}

function isPlaceholder(value?: string) {
  return !value || value.startsWith("REEMPLAZAR_CON_TU_");
}

export async function GET() {
  const { clientId, redirectUri } = getGoogleAuthConfig();

  if (isPlaceholder(clientId) || isPlaceholder(redirectUri)) {
    return NextResponse.redirect(new URL("/signin?error=google_not_configured", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const state = randomUUID();

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("state", state);
  googleUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(googleUrl);

  response.cookies.set("oauth_google_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
