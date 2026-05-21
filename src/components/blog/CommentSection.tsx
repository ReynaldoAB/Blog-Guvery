"use client";

import { useEffect, useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import type { BlogComment } from "@/types/blog";
import CommentForm, { type NewComment } from "@/components/blog/CommentForm";
import Link from "next/link";

type CommentSectionProps = {
  slug: string;
  initialComments: BlogComment[];
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function CommentSection({
  slug,
  initialComments,
}: CommentSectionProps) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [comments],
  );

  useEffect(() => {
    let isMounted = true;

    const loadComments = async () => {
      setIsLoading(true);
      setApiError(null);

      try {
        const response = await fetch(`/api/blog/${slug}/comments`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No fue posible cargar los comentarios");
        }

        const data = (await response.json()) as { comments?: BlogComment[] };

        if (isMounted) {
          setComments(data.comments ?? []);
        }
      } catch {
        if (isMounted) {
          setApiError("No fue posible conectar con la API de comentarios.");
          setComments([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadComments();

    const loadAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          setIsAuthenticated(false);
          setAuthDisplayName("");
          return;
        }

        const data = (await response.json()) as {
          user?: { name?: string | null; email?: string | null };
        };

        const displayName =
          (data.user?.name && data.user.name.trim()) ||
          (data.user?.email && data.user.email.trim()) ||
          "Usuario";

        setIsAuthenticated(true);
        setAuthDisplayName(displayName);
      } catch {
        setIsAuthenticated(false);
        setAuthDisplayName("");
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadAuthStatus();

    return () => {
      isMounted = false;
    };
  }, [slug, initialComments]);

  const handleAddComment = async ({ comment }: NewComment): Promise<boolean> => {
    if (!isAuthenticated) {
      setApiError("Debes iniciar sesión para publicar una reseña.");
      return false;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error || "No fue posible publicar el comentario");
      }

      const data = (await response.json()) as { comment?: BlogComment };

      if (data.comment) {
        setComments((prev) => [...prev, data.comment as BlogComment]);
      }

      return true;
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "No se pudo publicar el comentario. Intenta nuevamente."
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComponentCard
      title="Resenas y comentarios"
      desc="Comparte tu punto de vista y ayuda a enriquecer la conversacion."
      className="border-blue-light-100/80 bg-white/95 dark:border-gray-800 dark:bg-gray-900/85"
    >
      {isAuthLoading ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Verificando sesión...</p>
      ) : isAuthenticated ? (
        <CommentForm displayName={authDisplayName} onAddComment={handleAddComment} />
      ) : (
        <p className="rounded-lg border border-blue-light-200 bg-blue-light-50 px-3 py-2 text-xs text-blue-light-700 dark:border-blue-light-900 dark:bg-blue-light-950/40 dark:text-blue-light-300">
          Debes iniciar sesión para dejar una reseña. Puedes ver todas las reseñas publicadas aquí.
          {" "}
          <Link href="/signin" className="font-semibold underline">
            Iniciar sesión
          </Link>
        </p>
      )}

      {isSubmitting && (
        <p className="text-xs text-blue-light-700 dark:text-blue-light-300">
          Publicando comentario...
        </p>
      )}

      {apiError && (
        <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-xs text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-300">
          {apiError}
        </p>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Cargando comentarios...
          </div>
        ) : sortedComments.length > 0 ? (
          sortedComments.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-950"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.name}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                {item.comment}
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Aun no hay comentarios. Se la primera persona en participar.
          </div>
        )}
      </div>
    </ComponentCard>
  );
}