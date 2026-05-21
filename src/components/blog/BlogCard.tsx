import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/types/blog";
import Button from "@/components/ui/button/Button";

type BlogCardProps = {
  post: BlogPost;
  canReview: boolean;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function BlogCard({ post, canReview }: BlogCardProps) {
  const reviewHref = canReview
    ? `/blog/${post.slug}#comments`
    : `/signin?redirect=${encodeURIComponent(`/blog/${post.slug}#comments`)}`;

  return (
    <article className="group overflow-hidden rounded-3xl border border-orange-200/70 bg-white/90 shadow-lg shadow-orange-100/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-light-200/40 dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-none flex flex-col">
      <div className="relative h-52 overflow-hidden">
        <Image
          src={post.featuredImage}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold tracking-wide text-white">
          {post.category}
        </span>
      </div>

      <div className="space-y-4 p-6 flex grow flex-col">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDate(post.date)}</span>
          <span className="h-1 w-1 rounded-full bg-gray-400" />
          <span>{post.readTime}</span>
        </div>

        <h2 className="text-xl font-semibold leading-tight text-gray-900 transition-colors group-hover:text-blue-light-700 dark:text-white">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>

        <p className="line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
          {post.excerpt}
        </p>

        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={`${post.slug}-${tag}`}
              className="rounded-full bg-blue-light-50 px-2.5 py-1 text-xs font-medium text-blue-light-700 dark:bg-blue-light-900/40 dark:text-blue-light-300"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <Link href={reviewHref} className="block">
            <Button variant="primary" size="md" className="w-full">
              {canReview ? "Dejar una reseña" : "Inicia sesión para reseñar"}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}