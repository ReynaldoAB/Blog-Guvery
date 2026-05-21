import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getAuthUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = await verifyAuthToken(token);
    const id = Number(payload.sub);
    return isNaN(id) ? null : id;
  } catch {
    return null;
  }
}

// GET /api/subscriptions — retorna si el usuario autenticado está suscrito
export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);

  if (!userId) {
    return NextResponse.json({ subscribed: false });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  return NextResponse.json({ subscribed: !!subscription, id: subscription?.id ?? null });
}

// POST /api/subscriptions — suscribir al usuario autenticado
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const existing = await prisma.subscription.findUnique({ where: { userId } });

  if (existing) {
    return NextResponse.json({ subscribed: true, id: existing.id });
  }

  const subscription = await prisma.subscription.create({
    data: { userId },
  });

  return NextResponse.json({ subscribed: true, id: subscription.id }, { status: 201 });
}

// DELETE /api/subscriptions — cancelar suscripción del usuario autenticado
export async function DELETE(request: NextRequest) {
  const userId = await getAuthUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  await prisma.subscription.deleteMany({ where: { userId } });

  return NextResponse.json({ subscribed: false });
}
