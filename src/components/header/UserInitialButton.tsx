"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

function getInitials(name?: string | null, email?: string | null) {
  const candidate = (name && name.trim()) || (email && email.trim()) || "";

  if (!candidate) return "";

  const words = candidate.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return words[0].slice(0, 2).toUpperCase();
}

// Icono de silueta de persona (busto)
function PersonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3.5C9.51472 3.5 7.5 5.51472 7.5 8C7.5 10.4853 9.51472 12.5 12 12.5C14.4853 12.5 16.5 10.4853 16.5 8C16.5 5.51472 14.4853 3.5 12 3.5ZM6 8C6 4.68629 8.68629 2 12 2C15.3137 2 18 4.68629 18 8C18 11.3137 15.3137 14 12 14C8.68629 14 6 11.3137 6 8ZM4 21C4 17.134 7.13401 14 11 14H13C16.866 14 20 17.134 20 21C20 21.5523 19.5523 22 19 22C18.4477 22 18 21.5523 18 21C18 18.2386 15.7614 16 13 16H11C8.23858 16 6 18.2386 6 21C6 21.5523 5.55228 22 5 22C4.44772 22 4 21.5523 4 21Z"
      />
    </svg>
  );
}

export default function UserInitialButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initials, setInitials] = useState("");
  const [displayName, setDisplayName] = useState("");

  const redirectTarget = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { method: "GET" });

        if (!response.ok) {
          setIsAuthenticated(false);
          setInitials("");
          setDisplayName("");
          return;
        }

        const data = (await response.json()) as {
          user?: { name?: string | null; email?: string | null };
        };

        const name = data.user?.name?.trim() || "";
        const email = data.user?.email?.trim() || "";
        const computed = getInitials(name, email);

        setIsAuthenticated(true);
        setInitials(computed || "US");
        setDisplayName(name || email || "Usuario");
      } catch {
        setIsAuthenticated(false);
        setInitials("");
        setDisplayName("");
      }
    };

    loadCurrentUser();
  }, []);

  const toggleDropdown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => setIsOpen(false);

  const handleSignOut = async () => {
    closeDropdown();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.reload();
    }
  };

  const handleSignIn = () => {
    closeDropdown();
    window.location.href = `/signin?redirect=${encodeURIComponent(redirectTarget)}`;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label="Menú de usuario"
        className="dropdown-toggle flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white shadow-theme-xs"
      >
        {isAuthenticated ? initials : <PersonIcon />}
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="min-w-45 overflow-hidden"
      >
        {/* Encabezado del menú */}
        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          {isAuthenticated ? (
            <>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sesión activa</p>
            </>
          ) : (
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Acceso
            </p>
          )}
        </div>

        {isAuthenticated ? (
          <DropdownItem
            onClick={handleSignOut}
            className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Cerrar sesión
          </DropdownItem>
        ) : (
          <DropdownItem
            onClick={handleSignIn}
            className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Iniciar sesión
          </DropdownItem>
        )}
      </Dropdown>
    </div>
  );
}
