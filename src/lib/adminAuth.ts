import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/jwt";

export function isAdminEmail(email: string) {
  return email.trim().toLowerCase() === "admin@admin.com";
}

export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  try {
    const payload = await verifyAuthToken(token);
    const email = typeof payload.email === "string" ? payload.email : "";
    const userId = Number(payload.sub);

    if (!isAdminEmail(email)) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
      };
    }

    if (!userId || Number.isNaN(userId)) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: "Token inválido" }, { status: 401 }),
      };
    }

    return {
      ok: true as const,
      userId,
      email,
    };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Token inválido" }, { status: 401 }),
    };
  }
}