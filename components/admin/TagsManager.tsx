"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "../../lib/utils";
import { toast } from "sonner";

export default function TagsManager({ tags }: { tags: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function openNew() {
    setEditing(null);
    setName("");
    setSlug("");
    setIsOpen(true);
  }

  function openEdit(item: any) {
    setEditing(item);
    setName(item.name ?? "");
    setSlug(item.slug ?? slugify(item.name ?? ""));
    setIsOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Ad gerekli");

    const payload = { name: name.trim(), slug: slug.trim() || slugify(name) };
    try {
      const res = await fetch(editing?.id ? `/api/tags/${editing.id}` : "/api/tags", {
        method: editing?.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast.success(editing?.id ? "Etiket güncellendi" : "Etiket oluşturuldu");
        setIsOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.message || "İşlem başarısız");
      }
    } catch (err: any) {
      toast.error(err?.message || "Ağ hatası");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Etiketi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Etiket silindi");
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
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={openNew} className="px-3 py-2 bg-blue-600 rounded">Yeni Etiket</button>
      </div>

      {isOpen && (
        <form onSubmit={handleSave} className="mb-4 bg-white/5 p-4 rounded">
          <div className="grid gap-2">
            <label className="text-sm">Ad</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="p-2 bg-white/5 rounded" />

            <label className="text-sm">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="p-2 bg-white/5 rounded" />

            <div className="flex gap-2">
              <button type="submit" className="px-3 py-2 bg-green-600 rounded">Kaydet</button>
              <button type="button" onClick={() => setIsOpen(false)} className="px-3 py-2 bg-zinc-700 rounded">İptal</button>
            </div>
          </div>
        </form>
      )}

      <table className="w-full text-left bg-white/5 rounded">
        <thead className="text-zinc-400 text-sm">
          <tr>
            <th className="px-4 py-2">Ad</th>
            <th className="px-4 py-2">Slug</th>
            <th className="px-4 py-2">Yazı Sayısı</th>
            <th className="px-4 py-2">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((t) => (
            <tr key={t.id} className="border-t border-zinc-800">
              <td className="px-4 py-3">{t.name}</td>
              <td className="px-4 py-3">{t.slug}</td>
              <td className="px-4 py-3">{t._count?.posts ?? 0}</td>
              <td className="px-4 py-3">
                <button onClick={() => openEdit(t)} className="text-sm text-blue-400 mr-3">Düzenle</button>
                <button onClick={() => handleDelete(t.id)} className="text-sm text-red-400">Sil</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
