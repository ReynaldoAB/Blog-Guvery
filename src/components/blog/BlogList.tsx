"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { BlogPost } from "@/types/blog";
import BlogCard from "@/components/blog/BlogCard";
import Input from "@/components/form/input/InputField";

type BlogListProps = {
  posts: BlogPost[];
  tags: string[];
};

type SortOption = "newest" | "oldest" | "category";

export default function BlogList({ posts, tags }: BlogListProps) {
  const pageSize = 6;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    const loadAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        setCanReview(response.ok);
      } catch {
        setCanReview(false);
      }
    };

    loadAuthStatus();
  }, []);

  const currentPage = Math.max(1, Number(searchParams.get("page") ?? "1"));

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }

  function handleTagChange(tag: string) {
    setActiveTag(tag);
    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }

  function handleSortChange(sort: SortOption) {
    setSortBy(sort);
    if (currentPage !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }

  const filteredPosts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = posts.filter((post) => {
      const matchesTag =
        activeTag === "all" || post.tags.some((tag) => tag === activeTag);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        post.title.toLowerCase().includes(normalizedSearch) ||
        post.excerpt.toLowerCase().includes(normalizedSearch) ||
        post.author.toLowerCase().includes(normalizedSearch);

      return matchesTag && matchesSearch;
    });

    const sorted = [...filtered];

    if (sortBy === "newest") {
      sorted.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } else if (sortBy === "oldest") {
      sorted.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    } else if (sortBy === "category") {
      sorted.sort((a, b) => a.category.localeCompare(b.category, "es"));
    }

    return sorted;
  }, [posts, search, activeTag, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visiblePosts = filteredPosts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  // Page numbers to display (max 5, centered on current page)
  const maxShown = 5;
  let startPage = Math.max(1, safePage - Math.floor(maxShown / 2));
  const endPage = Math.min(totalPages, startPage + maxShown - 1);
  startPage = Math.max(1, endPage - maxShown + 1);
  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <section className="space-y-8">
      {/* Filters bar */}
      <div className="rounded-3xl border border-blue-light-100 bg-white/80 p-5 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/70 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <Input
              placeholder="Buscar por titulo, autor o resumen"
              onChange={(event) => handleSearchChange(event.target.value)}
              className="bg-white dark:bg-gray-900"
            />

            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-light-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:ring-blue-light-700"
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="category">Por categoría</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {["all", ...tags].map((tag) => {
              const selected = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors duration-200 ${
                    selected
                      ? "border-orange-400 bg-orange-500 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-blue-light-300 hover:text-blue-light-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  }`}
                >
                  {tag === "all" ? "Todas" : tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visiblePosts.map((post) => (
              <BlogCard key={post.slug} post={post} canReview={canReview} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Paginación de artículos"
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
            >
              <button
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage <= 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Página anterior"
              >
                ← Anterior
              </button>

              {startPage > 1 && (
                <>
                  <button
                    onClick={() => goToPage(1)}
                    className="min-w-8 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-blue-light-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="px-1 text-sm text-gray-400">…</span>
                  )}
                </>
              )}

              {pageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => goToPage(n)}
                  aria-current={n === safePage ? "page" : undefined}
                  className={`min-w-8 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    n === safePage
                      ? "border-orange-400 bg-orange-500 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-blue-light-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {n}
                </button>
              ))}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="px-1 text-sm text-gray-400">…</span>
                  )}
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="min-w-8 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-blue-light-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage >= totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Página siguiente"
              >
                Siguiente →
              </button>

              <span className="w-full text-center text-xs text-gray-500 dark:text-gray-400 sm:w-auto sm:text-left">
                Página {safePage} de {totalPages} · {filteredPosts.length}{" "}
                {filteredPosts.length === 1 ? "artículo" : "artículos"}
              </span>
            </nav>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-6 py-14 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-300">
          No encontramos artículos con ese criterio de búsqueda.
        </div>
      )}
    </section>
  );
}
