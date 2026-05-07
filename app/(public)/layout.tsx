import { Suspense } from "react";
import Link from "next/link";

import SearchBar from "../../components/public/SearchBar";
import AuthNav from "../../components/public/AuthNav";
import SessionProviderWrapper from "../../components/public/SessionProviderWrapper";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <SessionProviderWrapper>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-transparent">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(15,23,42,0.08),transparent_35%)]" />
        <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/75 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-950">
                GSÜ Blog
              </Link>
              <nav className="flex items-center gap-4 text-sm text-zinc-500">
                <Link href="/" className="transition-colors hover:text-zinc-950">
                  Anasayfa
                </Link>
                <Link href="/categories" className="transition-colors hover:text-zinc-950">
                  Kategoriler
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Suspense fallback={<div className="h-10 w-64 rounded-full border border-zinc-200 bg-white/70" />}>
                <SearchBar />
              </Suspense>
              <AuthNav />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
        <footer className="mt-12 border-t border-zinc-200/80 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center">
            <p>&copy; {year} GSÜ Blog. Tüm hakları saklıdır.</p>
            <nav className="flex items-center gap-4">
              <Link href="/" className="transition-colors hover:text-zinc-950">
                Anasayfa
              </Link>
              <Link href="/categories" className="transition-colors hover:text-zinc-950">
                Kategoriler
              </Link>
              <Link href="/search" className="transition-colors hover:text-zinc-950">
                Arama
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </SessionProviderWrapper>
  );
}
