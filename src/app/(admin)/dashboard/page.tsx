"use client";

import { useEffect, useMemo, useState } from "react";

type DashboardReview = {
  id: string;
  slug: string;
  name: string;
  comment: string;
  createdAt: string;
};

type DashboardPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  featuredImage: string;
  category: string;
  tags: string[] | null;
  readTime: string;
};

type DashboardData = {
  stats: {
    usersCount: number;
    subscribedCount: number;
    postsCount: number;
    reviewsCount: number;
  };
  reviews: DashboardReview[];
  posts: DashboardPost[];
};

type NewPostForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  featuredImage: string;
  category: string;
  tags: string;
  readTime: string;
  publishedAt: string;
};

const initialPostForm: NewPostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author: "",
  featuredImage: "",
  category: "",
  tags: "",
  readTime: "",
  publishedAt: "",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState<NewPostForm>(initialPostForm);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isCreatePostFormOpen, setIsCreatePostFormOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostForm, setEditingPostForm] = useState<NewPostForm>(initialPostForm);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [searchPostText, setSearchPostText] = useState("");
  const [selectedPostCategory, setSelectedPostCategory] = useState("all");

  const hasActiveFilters =
    searchText.trim().length > 0 ||
    selectedSlug !== "all" ||
    fromDate.length > 0 ||
    toDate.length > 0;

  const clearFilters = () => {
    setSearchText("");
    setSelectedSlug("all");
    setFromDate("");
    setToDate("");
  };

  const loadData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const responseData = (await response.json()) as { error?: string };
        setError(responseData.error || "No se pudo cargar el dashboard");
        return;
      }

      const payload = (await response.json()) as DashboardData;
      setData(payload);
      setError(null);
    } catch {
      setError("Error de conexión al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableSlugs = useMemo(() => {
    if (!data) return [];

    return Array.from(new Set(data.reviews.map((review) => review.slug))).sort();
  }, [data]);

  const filteredReviews = useMemo(() => {
    if (!data) return [];

    const normalizedSearch = searchText.trim().toLowerCase();
    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTime = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return data.reviews.filter((review) => {
      const reviewTime = new Date(review.createdAt).getTime();

      const matchesText =
        normalizedSearch.length === 0 ||
        review.name.toLowerCase().includes(normalizedSearch) ||
        review.comment.toLowerCase().includes(normalizedSearch);

      const matchesSlug = selectedSlug === "all" || review.slug === selectedSlug;
      const matchesFromDate = fromTime === null || reviewTime >= fromTime;
      const matchesToDate = toTime === null || reviewTime <= toTime;

      return matchesText && matchesSlug && matchesFromDate && matchesToDate;
    });
  }, [data, searchText, selectedSlug, fromDate, toDate]);

  const startEditing = (review: DashboardReview) => {
    setActionError(null);
    setEditingId(review.id);
    setEditingComment(review.comment);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingComment("");
    setActionError(null);
  };

  const handleSaveEdit = async (reviewId: string) => {
    const nextComment = editingComment.trim();

    if (!nextComment) {
      setActionError("El comentario no puede estar vacío");
      return;
    }

    setActionLoadingId(reviewId);
    setActionError(null);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: nextComment }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setActionError(body?.error || "No se pudo editar la reseña");
        return;
      }

      await loadData();
      cancelEditing();
    } catch {
      setActionError("Error de conexión al editar");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setActionLoadingId(reviewId);
    setActionError(null);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setActionError(body?.error || "No se pudo eliminar la reseña");
        return;
      }

      if (editingId === reviewId) {
        cancelEditing();
      }

      await loadData();
    } catch {
      setActionError("Error de conexión al eliminar");
    } finally {
      setActionLoadingId(null);
      setDeleteConfirmId(null);
    }
  };

  const promptDeleteConfirmation = (reviewId: string) => {
    setDeleteConfirmId(reviewId);
  };

  const cancelDeleteConfirmation = () => {
    setDeleteConfirmId(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    await handleDelete(deleteConfirmId);
  };

  const handlePostFieldChange = (field: keyof NewPostForm, value: string) => {
    setPostForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openCreatePostForm = () => {
    setPostError(null);
    setPostSuccess(null);
    setIsCreatePostFormOpen(true);
  };

  const cancelCreatePost = () => {
    setPostForm(initialPostForm);
    setPostError(null);
    setPostSuccess(null);
    setIsCreatePostFormOpen(false);
  };

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPostError(null);
    setPostSuccess(null);
    setIsCreatingPost(true);

    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...postForm,
          tags: postForm.tags,
          publishedAt: postForm.publishedAt || undefined,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; post?: { title: string; slug: string } }
        | null;

      if (!response.ok) {
        setPostError(body?.error || "No se pudo crear el artículo");
        return;
      }

      setPostForm(initialPostForm);
      setPostSuccess(
        body?.post
          ? `Artículo creado: ${body.post.title} (/blog/${body.post.slug})`
          : "Artículo creado correctamente",
      );
      setIsCreatePostFormOpen(false);
      await loadData();
    } catch {
      setPostError("Error de conexión al crear el artículo");
    } finally {
      setIsCreatingPost(false);
    }
  };

  const startEditingPost = (post: DashboardPost) => {
    setPostActionError(null);
    setEditingPostId(post.id);
    setEditingPostForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      featuredImage: post.featuredImage,
      category: post.category,
      tags: (Array.isArray(post.tags) ? post.tags : []).join(", "),
      readTime: post.readTime,
      publishedAt: post.publishedAt.split("T")[0],
    });
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditingPostForm(initialPostForm);
    setPostActionError(null);
  };

  const handleEditPostFieldChange = (field: keyof NewPostForm, value: string) => {
    setEditingPostForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveEditPost = async (postId: string) => {
    if (!editingPostForm.title.trim()) {
      setPostActionError("El título no puede estar vacío");
      return;
    }

    setActionLoadingId(postId);
    setPostActionError(null);

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingPostForm.title,
          slug: editingPostForm.slug,
          excerpt: editingPostForm.excerpt,
          content: editingPostForm.content,
          author: editingPostForm.author,
          featuredImage: editingPostForm.featuredImage,
          category: editingPostForm.category,
          tags: editingPostForm.tags,
          readTime: editingPostForm.readTime,
          publishedAt: editingPostForm.publishedAt || undefined,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setPostActionError(body?.error || "No se pudo editar el artículo");
        return;
      }

      await loadData();
      cancelEditingPost();
    } catch {
      setPostActionError("Error de conexión al editar");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setActionLoadingId(postId);
    setPostActionError(null);

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setPostActionError(body?.error || "No se pudo eliminar el artículo");
        return;
      }

      if (editingPostId === postId) {
        cancelEditingPost();
      }

      await loadData();
    } catch {
      setPostActionError("Error de conexión al eliminar");
    } finally {
      setActionLoadingId(null);
      setDeleteConfirmPostId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-600 dark:text-gray-300">Cargando dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600 dark:text-red-400">{error}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6 rounded-2xl border border-brand-100 bg-linear-to-br from-brand-25 via-white to-brand-50 p-4 sm:p-6 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard de Administración</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-brand-200 bg-white/95 p-4 shadow-theme-sm dark:border-brand-800 dark:bg-brand-900/20">
          <p className="text-xs uppercase tracking-wide text-brand-700 dark:text-brand-300">Usuarios registrados</p>
          <p className="mt-2 text-2xl font-semibold text-brand-900 dark:text-brand-100">{data.stats.usersCount}</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-white/95 p-4 shadow-theme-sm dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Usuarios suscritos</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">{data.stats.subscribedCount}</p>
        </div>

        <div className="rounded-xl border border-blue-light-200 bg-white/95 p-4 shadow-theme-sm dark:border-blue-light-800 dark:bg-blue-light-900/20">
          <p className="text-xs uppercase tracking-wide text-blue-light-700 dark:text-blue-light-300">Artículos publicados</p>
          <p className="mt-2 text-2xl font-semibold text-blue-light-900 dark:text-blue-light-100">{data.stats.postsCount}</p>
        </div>

        <div className="rounded-xl border border-teal-200 bg-white/95 p-4 shadow-theme-sm dark:border-teal-800 dark:bg-teal-900/20">
          <p className="text-xs uppercase tracking-wide text-teal-700 dark:text-teal-300">Cantidad de reseñas</p>
          <p className="mt-2 text-2xl font-semibold text-teal-900 dark:text-teal-100">{data.stats.reviewsCount}</p>
        </div>
      </div>

      <section className="rounded-xl border border-brand-200 bg-white/95 p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900/80">
        <h2 className="mb-4 text-lg font-semibold text-brand-900 dark:text-brand-100">Crear artículo</h2>

        {postError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {postError}
          </div>
        )}

        {postSuccess && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {postSuccess}
          </div>
        )}

        {!isCreatePostFormOpen ? (
          <button
            type="button"
            onClick={openCreatePostForm}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Crear artículo
          </button>
        ) : (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreatePost}>
            <input
              type="text"
              value={postForm.title}
              onChange={(event) => handlePostFieldChange("title", event.target.value)}
              placeholder="Título"
              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <input
              type="text"
              value={postForm.slug}
              onChange={(event) => handlePostFieldChange("slug", event.target.value)}
              placeholder="Slug opcional (se genera desde el título si lo dejas vacío)"
              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <input
              type="text"
              value={postForm.author}
              onChange={(event) => handlePostFieldChange("author", event.target.value)}
              placeholder="Autor"
              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <input
              type="text"
              value={postForm.category}
              onChange={(event) => handlePostFieldChange("category", event.target.value)}
              placeholder="Categoría"
              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <input
              type="text"
              value={postForm.featuredImage}
              onChange={(event) => handlePostFieldChange("featuredImage", event.target.value)}
              placeholder="Imagen destacada (ej. /images/grid-image/image-01.png)"
              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <input
              type="text"
              value={postForm.readTime}
              onChange={(event) => handlePostFieldChange("readTime", event.target.value)}
              placeholder="Tiempo de lectura (ej. 6 min)"
              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <input
              type="text"
              value={postForm.tags}
              onChange={(event) => handlePostFieldChange("tags", event.target.value)}
              placeholder="Tags separados por coma"
              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <input
              type="date"
              value={postForm.publishedAt}
              onChange={(event) => handlePostFieldChange("publishedAt", event.target.value)}
              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <textarea
              value={postForm.excerpt}
              onChange={(event) => handlePostFieldChange("excerpt", event.target.value)}
              placeholder="Resumen"
              rows={4}
              className="md:col-span-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <textarea
              value={postForm.content}
              onChange={(event) => handlePostFieldChange("content", event.target.value)}
              placeholder="Contenido en Markdown"
              rows={10}
              className="md:col-span-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelCreatePost}
                disabled={isCreatingPost}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreatingPost}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingPost ? "Grabando..." : "Grabar"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-brand-200 bg-white/95 p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900/80">
        <h2 className="mb-4 text-lg font-semibold text-brand-900 dark:text-brand-100">Administrar artículos</h2>

        {postActionError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {postActionError}
          </div>
        )}

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input
            type="text"
            value={searchPostText}
            onChange={(event) => setSearchPostText(event.target.value)}
            placeholder="Buscar por título"
            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />

          <select
            value={selectedPostCategory}
            onChange={(event) => setSelectedPostCategory(event.target.value)}
            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">Todas las categorías</option>
            {Array.from(new Set(data.posts.map((post) => post.category)))
              .sort()
              .map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchPostText("");
              setSelectedPostCategory("all");
            }}
            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            Limpiar filtros
          </button>
        </div>

        {data.posts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aún no hay artículos.</p>
        ) : (
          <div className="space-y-3">
            {data.posts
              .filter(
                (post) =>
                  post.title.toLowerCase().includes(searchPostText.toLowerCase()) &&
                  (selectedPostCategory === "all" || post.category === selectedPostCategory),
              )
              .map((post) => (
                <article
                  key={post.id}
                  className="rounded-lg border border-brand-100 bg-linear-to-r from-white to-brand-25 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{post.title}</span>
                    <span>•</span>
                    <span>{new Date(post.publishedAt).toLocaleDateString("es-PE")}</span>
                    <span>•</span>
                    <span className="text-blue-light-600 dark:text-blue-light-300">{post.category}</span>
                  </div>

                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Por {post.author} • {post.readTime}
                  </p>

                  {editingPostId === post.id ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <input
                        type="text"
                        value={editingPostForm.title}
                        onChange={(event) =>
                          handleEditPostFieldChange("title", event.target.value)
                        }
                        placeholder="Título"
                        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <input
                        type="text"
                        value={editingPostForm.slug}
                        onChange={(event) =>
                          handleEditPostFieldChange("slug", event.target.value)
                        }
                        placeholder="Slug"
                        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <input
                        type="text"
                        value={editingPostForm.author}
                        onChange={(event) =>
                          handleEditPostFieldChange("author", event.target.value)
                        }
                        placeholder="Autor"
                        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <textarea
                        value={editingPostForm.excerpt}
                        onChange={(event) =>
                          handleEditPostFieldChange("excerpt", event.target.value)
                        }
                        placeholder="Resumen"
                        rows={3}
                        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 md:col-span-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <textarea
                        value={editingPostForm.content}
                        onChange={(event) =>
                          handleEditPostFieldChange("content", event.target.value)
                        }
                        placeholder="Contenido en Markdown"
                        rows={8}
                        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 md:col-span-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <input
                        type="text"
                        value={editingPostForm.featuredImage}
                        onChange={(event) =>
                          handleEditPostFieldChange("featuredImage", event.target.value)
                        }
                        placeholder="Imagen destacada"
                        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <input
                        type="text"
                        value={editingPostForm.category}
                        onChange={(event) =>
                          handleEditPostFieldChange("category", event.target.value)
                        }
                        placeholder="Categoría"
                        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <input
                        type="text"
                        value={editingPostForm.tags}
                        onChange={(event) =>
                          handleEditPostFieldChange("tags", event.target.value)
                        }
                        placeholder="Tags separados por coma"
                        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <input
                        type="text"
                        value={editingPostForm.readTime}
                        onChange={(event) =>
                          handleEditPostFieldChange("readTime", event.target.value)
                        }
                        placeholder="Tiempo de lectura"
                        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <input
                        type="date"
                        value={editingPostForm.publishedAt}
                        onChange={(event) =>
                          handleEditPostFieldChange("publishedAt", event.target.value)
                        }
                        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                      <div className="flex items-center gap-2 md:col-span-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEditPost(post.id)}
                          disabled={actionLoadingId === post.id}
                          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingPost}
                          disabled={actionLoadingId === post.id}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditingPost(post)}
                        disabled={actionLoadingId === post.id}
                        className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-200"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmPostId(post.id)}
                        disabled={actionLoadingId === post.id}
                        className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                      >
                        Eliminar
                      </button>
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-blue-light-300 bg-blue-light-50 px-3 py-1.5 text-xs font-semibold text-blue-light-700 transition hover:bg-blue-light-100 dark:border-blue-light-800 dark:bg-blue-light-900/30 dark:text-blue-light-200"
                      >
                        Ver
                      </a>
                    </div>
                  )}
                </article>
              ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-brand-200 bg-white/95 p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900/80">
        <h2 className="mb-4 text-lg font-semibold text-brand-900 dark:text-brand-100">Lista de reseñas</h2>

        {actionError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {actionError}
          </div>
        )}

        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Buscar por autor o comentario"
            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />

          <select
            value={selectedSlug}
            onChange={(event) => setSelectedSlug(event.target.value)}
            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">Todos los artículos</option>
            {availableSlugs.map((slug) => (
              <option key={slug} value={slug}>
                /{slug}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            Limpiar filtros
          </button>
        </div>

        {filteredReviews.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aún no hay reseñas.</p>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-lg border border-brand-100 bg-linear-to-r from-white to-brand-25 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{review.name}</span>
                  <span>•</span>
                  <span>{new Date(review.createdAt).toLocaleString("es-PE")}</span>
                  <span>•</span>
                  <span>/{review.slug}</span>
                </div>

                {editingId === review.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editingComment}
                      onChange={(event) => setEditingComment(event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(review.id)}
                        disabled={actionLoadingId === review.id}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={actionLoadingId === review.id}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{review.comment}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(review)}
                        disabled={actionLoadingId === review.id}
                        className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-200"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDeleteConfirmation(review.id)}
                        disabled={actionLoadingId === review.id}
                        className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white shadow-lg dark:border-red-800 dark:bg-gray-900">
            <div className="px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmar eliminación
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                ¿Estás seguro de que deseas eliminar esta reseña? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={cancelDeleteConfirmation}
                disabled={actionLoadingId === deleteConfirmId}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={actionLoadingId === deleteConfirmId}
                className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white shadow-lg dark:border-red-800 dark:bg-gray-900">
            <div className="px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmar eliminación
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                ¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmPostId(null)}
                disabled={actionLoadingId === deleteConfirmPostId}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePost(deleteConfirmPostId)}
                disabled={actionLoadingId === deleteConfirmPostId}
                className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
