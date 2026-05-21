import Link from "next/link";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserInitialButton from "@/components/header/UserInitialButton";
import SubscribeButton from "@/components/blog/SubscribeButton";
import AdminDashboardButton from "@/components/blog/AdminDashboardButton";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-b from-brand-25 via-brand-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="sticky top-0 z-40 border-b border-brand-100/70 bg-white/85 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/blog" className="group inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-content-center rounded-2xl bg-linear-to-tr from-green-500 via-emerald-500 to-teal-400 text-sm font-bold text-white shadow-lg shadow-green-300/40">
              G
            </span>
            <span className="text-sm font-semibold tracking-wide text-gray-800 group-hover:text-green-600 dark:text-white">
              Blog de Guvery
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <AdminDashboardButton />
            <Link
              href="/blog"
              className="rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:border-green-400 hover:text-green-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              Articulos
            </Link>
            <a
              href="https://guvery.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-green-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-green-600"
            >
              Ir a Guvery
            </a>
            <ThemeToggleButton />
            <SubscribeButton />
            <UserInitialButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      <footer className="border-t border-brand-100 bg-white/70 py-8 dark:border-gray-800 dark:bg-gray-950/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-gray-300">
          <p>Blog de Guvery · Consejos para comprar desde EE.UU. con viajeros.</p>
          <p>
            <a
              href="https://guvery.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-green-600"
            >
              guvery.com
            </a>
            {" "}· La forma mas confiable de traer pedidos de USA a Peru.
          </p>
        </div>
      </footer>
    </div>
  );
}