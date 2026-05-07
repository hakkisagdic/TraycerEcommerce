"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-200" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="max-w-40 truncate rounded-full border border-zinc-200 bg-white/80 px-3 py-2 text-zinc-600 shadow-sm">
          {session.user.name ?? session.user.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-950"
        >
          Çıkış Yap
        </button>
      </div>
    );
  }

  return <Link href="/login" className="rounded-full border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-950">Giriş Yap</Link>;
}
