import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/blogPostsStore";
import { addCommentBySlug, getCommentsBySlug } from "@/lib/blogCommentsStore";
import { verifyAuthToken } from "@/lib/jwt";

export const runtime = "nodejs";

// ── In-memory rate limiter ────────────────────────────────────────────────────
// Allows MAX_REQUESTS per IP within WINDOW_MS
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;

type RateRecord = { count: number; windowStart: number };
const rateLimitMap = new Map<string, RateRecord>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count += 1;
  return false;
}

// ── Sanitization helpers ──────────────────────────────────────────────────────
const NAME_MIN = 2;
const NAME_MAX = 100;
const COMMENT_MIN = 10;
const COMMENT_MAX = 2000;

/** Strip HTML tags to prevent stored XSS */
function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

function sanitize(value: string): string {
  return stripHtml(value).trim();
}

// ── Route context ─────────────────────────────────────────────────────────────
type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const comments = await getCommentsBySlug(slug);
  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const authToken = request.cookies.get("auth_token")?.value;
  if (!authToken) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para publicar una reseña." },
      { status: 401 }
    );
  }

  let authPayload: Awaited<ReturnType<typeof verifyAuthToken>>;
  try {
    authPayload = await verifyAuthToken(authToken);
  } catch {
    return NextResponse.json(
      { error: "Tu sesión no es válida. Inicia sesión nuevamente." },
      { status: 401 }
    );
  }

  // Rate limiting
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados comentarios. Intenta de nuevo más tarde." },
      { status: 429 },
    );
  }

  const body = (await request.json()) as { comment?: string };
  const nameSource =
    (typeof authPayload.name === "string" ? authPayload.name : "") ||
    (typeof authPayload.email === "string" ? authPayload.email : "");
  const name = sanitize(nameSource);
  const comment = sanitize(body.comment ?? "");

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return NextResponse.json(
      {
        error: `El nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres.`,
      },
      { status: 400 },
    );
  }

  if (comment.length < COMMENT_MIN || comment.length > COMMENT_MAX) {
    return NextResponse.json(
      {
        error: `El comentario debe tener entre ${COMMENT_MIN} y ${COMMENT_MAX} caracteres.`,
      },
      { status: 400 },
    );
  }

  const newComment = await addCommentBySlug(slug, { name, comment });
  return NextResponse.json({ comment: newComment }, { status: 201 });
}
