"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboardButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          setIsAdmin(false);
          return;
        }

        const data = (await response.json()) as {
          user?: { isAdmin?: boolean };
        };

        setIsAdmin(Boolean(data.user?.isAdmin));
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className="rounded-full border border-brand-300 bg-brand-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-800 transition hover:border-brand-500 hover:bg-brand-200 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
    >
      Dashboard
    </Link>
  );
}
