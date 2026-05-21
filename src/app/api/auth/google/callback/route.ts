import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { signAuthToken } from "@/lib/jwt";

const prisma = new PrismaClient();

function appBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

function isPlaceholder(value?: string) {
  return !value || value.startsWith("REEMPLAZAR_CON_TU_");
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const stateCookie = request.cookies.get("oauth_google_state")?.value;

    if (!code || !state || !stateCookie || state !== stateCookie) {
      return NextResponse.redirect(new URL("/signin?error=google_state_invalid", appBaseUrl(request)));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (
      isPlaceholder(clientId) ||
      isPlaceholder(clientSecret) ||
      isPlaceholder(redirectUri)
    ) {
      return NextResponse.redirect(new URL("/signin?error=google_not_configured", appBaseUrl(request)));
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/signin?error=google_token_exchange_failed", appBaseUrl(request)));
    }

    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      return NextResponse.redirect(new URL("/signin?error=google_token_missing", appBaseUrl(request)));
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
      },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(new URL("/signin?error=google_profile_failed", appBaseUrl(request)));
    }

    const profileJson = (await profileRes.json()) as {
      email?: string;
      name?: string;
      email_verified?: boolean;
    };

    if (!profileJson.email || profileJson.email_verified === false) {
      return NextResponse.redirect(new URL("/signin?error=google_email_invalid", appBaseUrl(request)));
    }

    const normalizedEmail = profileJson.email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const generatedPassword = await hashPassword(randomUUID());

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: profileJson.name ? profileJson.name.trim() : undefined,
          password: generatedPassword,
        },
      });
    }

    const authToken = await signAuthToken({
      sub: String(user.id),
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.redirect(new URL("/", appBaseUrl(request)));

    response.cookies.set("oauth_google_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("auth_token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Error en callback de Google:", error);
    return NextResponse.redirect(new URL("/signin?error=google_unknown_error", appBaseUrl(request)));
  } finally {
    await prisma.$disconnect();
  }
}
