"use client";

import { useEffect, useState } from "react";

type SubscriptionState = "loading" | "unauthenticated" | "hidden" | "subscribed" | "unsubscribed" | "error";

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

export default function SubscribeButton() {
  const [state, setState] = useState<SubscriptionState>("loading");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Verificar si está autenticado
        const meRes = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });
        if (!meRes.ok) {
          setState("unauthenticated");
          return;
        }

        const meData = (await meRes.json()) as {
          user?: { isAdmin?: boolean };
        };

        if (meData.user?.isAdmin) {
          setState("hidden");
          return;
        }

        // Verificar si está suscrito
        const subRes = await fetch("/api/subscriptions", { method: "GET", cache: "no-store" });
        if (!subRes.ok) {
          setState("unsubscribed");
          return;
        }

        const data = (await subRes.json()) as { subscribed: boolean };
        setState(data.subscribed ? "subscribed" : "unsubscribed");
      } catch {
        setState("unauthenticated");
      }
    };

    checkStatus();
  }, []);

  const handleUnsubscribe = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/subscriptions", { method: "DELETE" });
      if (res.ok) {
        setState("unsubscribed");
      } else {
        setState("error");
        setTimeout(() => setState("subscribed"), 2500);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("subscribed"), 2500);
    }
  };

  const handleSubscribe = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/subscriptions", { method: "POST" });
      if (res.ok) {
        setState("subscribed");
      } else {
        setState("error");
        setTimeout(() => setState("unsubscribed"), 2500);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("unsubscribed"), 2500);
    }
  };

  // No mostrar nada si no está autenticado o está cargando
  if (state === "unauthenticated" || state === "hidden" || state === "loading") {
    return null;
  }

  if (state === "error") {
    return (
      <span className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-600 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400">
        Error al suscribirse
      </span>
    );
  }

  if (state === "subscribed") {
    return (
      <button
        type="button"
        onClick={handleUnsubscribe}
        title="Suscrito — clic para cancelar suscripción"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-green-300 bg-green-50 text-green-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:border-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400"
      >
        <BellIcon />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      className="rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:border-green-400 hover:text-green-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
    >
      Suscribirse
    </button>
  );
}
