import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { deleteCommentById, updateCommentById } from "@/lib/blogCommentsStore";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { comment?: string } | null;
  const nextComment = body?.comment?.trim();

  if (!nextComment) {
    return NextResponse.json({ error: "Comentario inválido" }, { status: 400 });
  }

  const updated = await updateCommentById(id, { comment: nextComment });

  if (!updated) {
    return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ review: updated }, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const deleted = await deleteCommentById(id);

  if (!deleted) {
    return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ review: deleted }, { status: 200 });
}
