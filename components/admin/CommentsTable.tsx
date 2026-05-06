"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CommentsTable({ comments }: { comments: any[] }) {
  const router = useRouter();

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "PUT", body: JSON.stringify({ status }), headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        toast.success("Durum güncellendi");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.message || "Güncelleme başarısız");
      }
    } catch (err: any) {
      toast.error(err?.message || "Ağ hatası");
    }
  }

  async function remove(id: string) {
    if (!confirm("Yorumu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Yorum silindi");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.message || "Silme başarısız");
      }
    } catch (err: any) {
      toast.error(err?.message || "Ağ hatası");
    }
  }

  return (
    <div className="bg-white/5 rounded">
      <table className="w-full">
        <thead className="text-zinc-400 text-sm">
          <tr>
            <th className="px-4 py-2">Yazar</th>
            <th className="px-4 py-2">Yazı</th>
            <th className="px-4 py-2">İçerik</th>
            <th className="px-4 py-2">Durum</th>
            <th className="px-4 py-2">Tarih</th>
            <th className="px-4 py-2">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((c) => (
            <tr key={c.id} className="border-t border-zinc-800">
              <td className="px-4 py-3">{c.author?.name ?? c.author?.email ?? "Anon"}</td>
              <td className="px-4 py-3">{c.post?.title ?? "-"}</td>
              <td className="px-4 py-3">{(c.content || "").slice(0, 80)}</td>
              <td className="px-4 py-3">{c.status}</td>
              <td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 flex gap-2">
                <button onClick={() => updateStatus(c.id, "approved")} className="text-sm text-green-400">Onayla</button>
                <button onClick={() => updateStatus(c.id, "rejected")} className="text-sm text-yellow-400">Reddet</button>
                <button onClick={() => remove(c.id)} className="text-sm text-red-400">Sil</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
