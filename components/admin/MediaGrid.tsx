"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MediaUploader, { type UploadedMedia } from "./MediaUploader";

type MediaItem = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string | Date;
};

type MediaGridProps = {
  items: MediaItem[];
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaGrid({ items }: MediaGridProps) {
  const router = useRouter();
  const [list, setList] = useState<MediaItem[]>(items);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setList(items);
  }, [items]);

  function handleUploaded(_url: string | UploadedMedia, media?: UploadedMedia) {
    const created =
      media ?? (typeof _url === "object" ? (_url as UploadedMedia) : undefined);
    if (created && created.id) {
      setList((prev) =>
        prev.some((m) => m.id === created.id) ? prev : [created, ...prev],
      );
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu medyayı silmek istediğinize emin misiniz?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Silme işlemi başarısız");
        return;
      }
      setList((prev) => prev.filter((m) => m.id !== id));
      toast.success("Medya silindi");
    } catch (err: any) {
      toast.error(err?.message || "Ağ hatası");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-400">{list.length} medya öğesi</p>
        <MediaUploader onUpload={handleUploaded} label="Yeni Görsel Yükle" />
      </div>

      {list.length === 0 ? (
        <div className="text-zinc-400 p-8 text-center bg-white/5 rounded">
          Henüz medya yok.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((m) => (
            <div
              key={m.id}
              className="bg-white/5 rounded overflow-hidden flex flex-col"
            >
              <div className="aspect-square bg-black/30 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2 text-xs text-zinc-300 flex-1">
                <div className="truncate" title={m.originalName}>
                  {m.originalName}
                </div>
                <div className="text-zinc-500">{formatSize(m.size)}</div>
              </div>
              <div className="p-2 pt-0">
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="w-full px-2 py-1 text-xs bg-red-600/80 hover:bg-red-600 rounded text-white disabled:opacity-50"
                >
                  {deletingId === m.id ? "Siliniyor..." : "Sil"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
