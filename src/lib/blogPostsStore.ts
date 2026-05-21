import "server-only";

import { prisma } from "@/lib/prisma";
import type { BlogPost } from "@/types/blog";

type DbPostRecord = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: Date;
  featuredImage: string;
  category: string;
  tags: string[] | null;
  readTime: string;
};

function mapPost(record: DbPostRecord): BlogPost {
  const tags = Array.isArray(record.tags) ? record.tags : [];

  return {
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    content: record.content,
    author: record.author,
    date: record.publishedAt.toISOString().slice(0, 10),
    featuredImage: record.featuredImage,
    category: record.category,
    tags,
    readTime: record.readTime,
    comments: [],
  };
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await prisma.post.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return posts.map(mapPost);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const post = await prisma.post.findUnique({
    where: { slug },
  });

  return post ? mapPost(post) : undefined;
}

export async function getAllTags(): Promise<string[]> {
  const posts = await prisma.post.findMany({
    select: { tags: true },
  });

  return Array.from(
    new Set(
      posts.flatMap((post) => (Array.isArray(post.tags) ? post.tags : [])),
    ),
  ).sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}