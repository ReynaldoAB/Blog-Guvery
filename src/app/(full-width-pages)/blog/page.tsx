import { Suspense } from "react";
import type { Metadata } from "next";
import BlogList from "@/components/blog/BlogList";
import { getAllPosts, getAllTags } from "@/lib/blogPostsStore";

export const metadata: Metadata = {
  title: "Blog | Guvery",
  description: "Consejos, guias y novedades para comprar desde Estados Unidos con viajeros en Guvery.",
};

export const revalidate = 60;

export default async function BlogPage() {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-linear-to-r from-green-600 via-emerald-500 to-teal-400 px-6 py-10 text-white shadow-xl shadow-green-300/40 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
          Blog de Guvery
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
          Todo lo que necesitas saber para comprar desde EE.UU. con viajeros
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/90 sm:text-base">
          Guias practicas, consejos de aduanas, los productos mas pedidos y las experiencias de nuestra comunidad de compradores y viajeros.
        </p>
      </section>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />}>
        <BlogList posts={posts} tags={tags} />
      </Suspense>
    </div>
  );
}