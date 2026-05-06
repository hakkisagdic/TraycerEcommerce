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
    <div className="flex items-center gap-3 mt-6">
      <button disabled={page <= 1} onClick={() => goto(page - 1)} className="px-3 py-2 bg-zinc-800 rounded disabled:opacity-50">
        « Önceki
      </button>
      <div className="text-sm text-zinc-400">Sayfa {page} / {totalPages}</div>
      <button disabled={page >= totalPages} onClick={() => goto(page + 1)} className="px-3 py-2 bg-zinc-800 rounded disabled:opacity-50">
        Sonraki »
      </button>
    </div>
  );
}
