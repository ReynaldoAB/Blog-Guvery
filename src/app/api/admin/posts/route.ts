import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

type CreatePostBody = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  author?: string;
  featuredImage?: string;
  category?: string;
  tags?: string[] | string;
  readTime?: string;
  publishedAt?: string;
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeTags(value: CreatePostBody["tags"]) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
  }

  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }

  return [];
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as CreatePostBody | null;

  const title = body?.title?.trim() ?? "";
  const excerpt = body?.excerpt?.trim() ?? "";
  const content = body?.content?.trim() ?? "";
  const author = body?.author?.trim() ?? "";
  const featuredImage = body?.featuredImage?.trim() ?? "";
  const category = body?.category?.trim() ?? "";
  const readTime = body?.readTime?.trim() ?? "";
  const rawSlug = body?.slug?.trim() || title;
  const slug = toSlug(rawSlug);
  const tags = normalizeTags(body?.tags);
  const publishedAt = body?.publishedAt?.trim()
    ? new Date(body.publishedAt)
    : new Date();

  if (!title || !excerpt || !content || !author || !featuredImage || !category || !readTime) {
    return NextResponse.json(
      { error: "Completa todos los campos obligatorios del artículo" },
      { status: 400 },
    );
  }

  if (!slug) {
    return NextResponse.json({ error: "No se pudo generar un slug válido" }, { status: 400 });
  }

  if (Number.isNaN(publishedAt.getTime())) {
    return NextResponse.json({ error: "La fecha de publicación es inválida" }, { status: 400 });
  }

  try {
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        author,
        featuredImage,
        category,
        tags,
        readTime,
        publishedAt,
      },
      select: {
        slug: true,
        title: true,
      },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Ya existe un artículo con ese slug" },
        { status: 409 },
      );
    }

    console.error("Error al crear artículo:", error);
    return NextResponse.json(
      { error: "No se pudo crear el artículo" },
      { status: 500 },
    );
  }
}