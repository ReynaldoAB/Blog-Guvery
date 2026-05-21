import "server-only";

import { prisma } from "@/lib/prisma";
import type { BlogComment } from "@/types/blog";

export type BlogCommentWithSlug = BlogComment & { slug: string };

export const getCommentsBySlug = async (slug: string): Promise<BlogComment[]> => {
  const reviews = await prisma.review.findMany({
    where: { slug },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((review) => ({
    id: review.id,
    name: review.name,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  }));
};

export const addCommentBySlug = async (
  slug: string,
  input: { name: string; comment: string },
): Promise<BlogComment> => {
  const review = await prisma.review.create({
    data: {
      slug,
      name: input.name,
      comment: input.comment,
    },
  });

  return {
    id: review.id,
    name: review.name,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
};

export const getAllCommentsWithSlug = async (): Promise<BlogCommentWithSlug[]> => {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((review) => ({
    id: review.id,
    name: review.name,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    slug: review.slug,
  }));
};

export const updateCommentById = async (
  commentId: string,
  input: { comment: string },
): Promise<BlogCommentWithSlug | null> => {
  const review = await prisma.review.update({
    where: { id: commentId },
    data: { comment: input.comment },
  }).catch(() => null);

  if (!review) {
    return null;
  }

  return {
    id: review.id,
    name: review.name,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    slug: review.slug,
  };
};

export const deleteCommentById = async (
  commentId: string,
): Promise<BlogCommentWithSlug | null> => {
  const review = await prisma.review.delete({
    where: { id: commentId },
  }).catch(() => null);

  if (!review) {
    return null;
  }

  return {
    id: review.id,
    name: review.name,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    slug: review.slug,
  };
};
