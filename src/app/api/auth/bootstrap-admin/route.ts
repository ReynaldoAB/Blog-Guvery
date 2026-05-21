import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "123456";

export async function POST(request: NextRequest) {
  try {
    const isBootstrapEnabled = process.env.ENABLE_ADMIN_BOOTSTRAP === "true";
    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
    const providedToken = request.headers.get("x-bootstrap-token");

    if (!isBootstrapEnabled) {
      return NextResponse.json(
        {
          error:
            "Endpoint temporal deshabilitado. Activa ENABLE_ADMIN_BOOTSTRAP=true para usarlo.",
        },
        { status: 403 }
      );
    }

    if (!bootstrapToken || providedToken !== bootstrapToken) {
      return NextResponse.json(
        { error: "No autorizado para ejecutar bootstrap de administrador" },
        { status: 401 }
      );
    }

    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      return NextResponse.json(
        {
          message: "El usuario administrador ya existe",
          user: {
            id: existingAdmin.id,
            email: existingAdmin.email,
            name: existingAdmin.name,
          },
        },
        { status: 200 }
      );
    }

    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    const adminUser = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: "Administrador",
      },
    });

    return NextResponse.json(
      {
        message:
          "Administrador inicial creado. Deshabilita ENABLE_ADMIN_BOOTSTRAP al terminar.",
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en bootstrap-admin:", error);
    return NextResponse.json(
      { error: "No se pudo crear el administrador inicial" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
