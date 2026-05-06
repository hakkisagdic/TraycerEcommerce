"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PostFilters({ categories = [] }: { categories?: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/posts?${params.toString()}`);
  }

  return (
    <div className="flex gap-3 mb-4">
      <input
        defaultValue={searchParams.get("q") ?? ""}
        onBlur={(e) => updateParam("q", e.currentTarget.value)}
        placeholder="Ara..."
        className="px-3 py-2 bg-white/5 rounded-md"
      />

      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.currentTarget.value)}
        className="px-3 py-2 bg-white/5 rounded-md"
      >
        <option value="">Tümü</option>
        <option value="draft">Taslak</option>
        <option value="published">Yayınlandı</option>
      </select>

      <select
        defaultValue={searchParams.get("categoryId") ?? ""}
        onChange={(e) => updateParam("categoryId", e.currentTarget.value)}
        className="px-3 py-2 bg-white/5 rounded-md"
      >
        <option value="">Tüm kategoriler</option>
        {categories.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
