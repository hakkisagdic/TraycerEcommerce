"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PostsTable({ posts }: { posts: any[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Yazıyı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Yazı silindi");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.message || "Silme işlemi başarısız");
      }
    } catch (err: any) {
      toast.error(err?.message || "Ağ hatası");
    }
  }

  return (
    <div className="bg-white/5 rounded-md overflow-hidden">
      <table className="w-full text-left">
        <thead className="text-zinc-400 text-sm">
          <tr>
            <th className="px-4 py-2">Başlık</th>
            <th className="px-4 py-2">Kategori</th>
            <th className="px-4 py-2">Durum</th>
            <th className="px-4 py-2">Tarih</th>
            <th className="px-4 py-2">Yorumlar</th>
            <th className="px-4 py-2">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className="border-t border-zinc-800">
              <td className="px-4 py-3">{p.title}</td>
              <td className="px-4 py-3">{p.category?.name ?? "-"}</td>
              <td className="px-4 py-3">{p.status}</td>
              <td className="px-4 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">{p._count?.comments ?? 0}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link href={`/admin/posts/${p.id}/edit`} className="text-sm text-blue-400">
                    Düzenle
                  </Link>
                  <button onClick={() => handleDelete(p.id)} className="text-sm text-red-400">
                    Sil
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
