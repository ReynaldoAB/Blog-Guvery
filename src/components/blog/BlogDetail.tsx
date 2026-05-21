import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BlogPost } from "@/types/blog";
import CommentSection from "@/components/blog/CommentSection";

type BlogDetailProps = {
  post: BlogPost;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const DEFAULT_FEATURED_IMAGE = "/images/grid-image/image-01.png";

export default function BlogDetail({ post }: BlogDetailProps) {
  const safeTags = Array.isArray(post.tags) ? post.tags : [];
  const featuredImage = post.featuredImage?.trim() || DEFAULT_FEATURED_IMAGE;

  return (
    <div className="space-y-8">
      <article className="overflow-hidden rounded-3xl border border-blue-light-100 bg-white/90 shadow-xl shadow-blue-light-100/40 dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-none">
        <div className="relative h-60 w-full sm:h-[340px]">
          <Image
            src={featuredImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-white/90">
              <span className="rounded-full bg-orange-500 px-3 py-1 font-semibold">
                {post.category}
              </span>
              <span>{formatDate(post.date)}</span>
              <span>{post.readTime}</span>
              <span>Por {post.author}</span>
            </div>

            <h1 className="max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl">
              {post.title}
            </h1>
          </div>
        </div>

        <div className="space-y-6 p-6 text-gray-700 dark:text-gray-200 sm:p-8">
          <p className="text-lg leading-8 text-gray-600 dark:text-gray-300">{post.excerpt}</p>

          <div className="space-y-4 text-base leading-8 text-gray-700 dark:text-gray-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
                    {children}
                  </h2>
                ),
                p: ({ children }) => <p className="leading-8">{children}</p>,
                ul: ({ children }) => <ul className="list-disc space-y-2 pl-5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal space-y-2 pl-5">{children}</ol>,
                li: ({ children }) => <li>{children}</li>,
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="font-medium text-blue-light-700 underline underline-offset-2 dark:text-blue-light-300"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-white">
                    {children}
                  </strong>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {safeTags.map((tag) => (
              <span
                key={`${post.slug}-detail-${tag}`}
                className="rounded-full bg-blue-light-50 px-3 py-1 text-xs font-semibold text-blue-light-700 dark:bg-blue-light-900/40 dark:text-blue-light-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      <div id="comments">
        <CommentSection slug={post.slug} initialComments={post.comments} />
      </div>
    </div>
  );
}