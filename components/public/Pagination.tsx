"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

export default function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goto(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 shadow-sm">
      <button disabled={page <= 1} onClick={() => goto(page - 1)} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40">
        « Önceki
      </button>
      <div className="text-sm font-medium text-zinc-500">Sayfa {page} / {totalPages}</div>
      <button disabled={page >= totalPages} onClick={() => goto(page + 1)} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40">
        Sonraki »
      </button>
    </div>
  );
}
