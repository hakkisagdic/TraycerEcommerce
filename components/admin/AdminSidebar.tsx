"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts", label: "Yazılar" },
  { href: "/admin/categories", label: "Kategoriler" },
  { href: "/admin/tags", label: "Etiketler" },
  { href: "/admin/comments", label: "Yorumlar" },
  { href: "/admin/media", label: "Medya" },
];

export default function AdminSidebar() {
  const pathname = usePathname() || "/admin";

  return (
    <aside className="w-64 bg-zinc-900 text-white min-h-screen p-4">
      <div className="mb-6">
        <div className="text-xl font-bold">GSÜ</div>
        <div className="text-sm text-zinc-400">Admin Panel</div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-md hover:bg-zinc-800 ${
                active ? "bg-zinc-800 font-semibold" : "text-zinc-300"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
