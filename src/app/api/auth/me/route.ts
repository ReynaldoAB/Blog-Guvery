import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/jwt";

function isAdminEmail(email: string) {
  return email.trim().toLowerCase() === "admin@admin.com";
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const payload = await verifyAuthToken(token);
    const email = typeof payload.email === "string" ? payload.email : "";

    return NextResponse.json(
      {
        user: {
          id: payload.sub,
          email,
          name: typeof payload.name === "string" ? payload.name : null,
          isAdmin: isAdminEmail(email),
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
