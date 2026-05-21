import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { getAllCommentsWithSlug } from "@/lib/blogCommentsStore";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const [usersCount, subscribedCount, postsCount, posts] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count(),
    prisma.post.count(),
    prisma.post.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        author: true,
        publishedAt: true,
        featuredImage: true,
        category: true,
        tags: true,
        readTime: true,
      },
    }),
  ]);

  const comments = await getAllCommentsWithSlug();

  return NextResponse.json(
    {
      stats: {
        usersCount,
        subscribedCount,
        postsCount,
        reviewsCount: comments.length,
      },
      reviews: comments,
      posts: posts.map((post) => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        author: post.author,
        publishedAt: post.publishedAt.toISOString(),
        featuredImage: post.featuredImage,
        category: post.category,
        tags: post.tags,
        readTime: post.readTime,
      })),
    },
    { status: 200 },
  );
}
