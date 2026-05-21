import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const adminResult = await requireAdmin(request);
  if (!adminResult.ok) {
    return adminResult.response;
  }

  const { id } = await params;

  try {
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      slug?: string;
      excerpt?: string;
      content?: string;
      author?: string;
      featuredImage?: string;
      category?: string;
      tags?: string | string[];
      readTime?: string;
      publishedAt?: string;
    } | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Normalize tags
    let tags: string[] | undefined;
    if (body.tags) {
      if (typeof body.tags === "string") {
        tags = body.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      } else if (Array.isArray(body.tags)) {
        tags = body.tags;
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.author !== undefined) updateData.author = body.author;
    if (body.featuredImage !== undefined) updateData.featuredImage = body.featuredImage;
    if (body.category !== undefined) updateData.category = body.category;
    if (tags !== undefined) updateData.tags = tags;
    if (body.readTime !== undefined) updateData.readTime = body.readTime;
    if (body.publishedAt !== undefined) updateData.publishedAt = new Date(body.publishedAt);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/blog");
    revalidatePath("/dashboard");
    if (post.slug) {
      revalidatePath(`/blog/${post.slug}`);
    }

    return NextResponse.json({
      message: "Post updated successfully",
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("Unique constraint failed")) {
      return NextResponse.json({ error: "Slug ya existe" }, { status: 409 });
    }

    if (errorMessage.includes("Record to update not found")) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ error: "Error al actualizar artículo" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const adminResult = await requireAdmin(request);
  if (!adminResult.ok) {
    return adminResult.response;
  }

  const { id } = await params;

  try {
    const post = await prisma.post.delete({
      where: { id },
    });

    revalidatePath("/blog");
    revalidatePath("/dashboard");
    if (post.slug) {
      revalidatePath(`/blog/${post.slug}`);
    }

    return NextResponse.json({
      message: "Post deleted successfully",
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("Record to update not found")) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ error: "Error al eliminar artículo" }, { status: 500 });
  }
}
