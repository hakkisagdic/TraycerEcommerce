"use client";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

export type UploadedMedia = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string | Date;
};

type MediaUploaderProps = {
  onUpload: (urlOrMedia: string | UploadedMedia, media?: UploadedMedia) => void;
  label?: string;
  className?: string;
};

const ACCEPTED_TYPES = "image/jpeg,image/jpg,image/png,image/gif,image/webp";

export default function MediaUploader({
  onUpload,
  label = "Görsel Yükle",
  className = "",
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  function openPicker() {
    if (loading) return;
    inputRef.current?.click();
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Görsel yüklenemedi");
        return;
      }

      const media = (await res.json()) as UploadedMedia;
      if (!media?.url) {
        toast.error("Yükleme yanıtı geçersiz");
        return;
      }
      onUpload(media.url, media);
      toast.success("Görsel yüklendi");
    } catch (err: any) {
      toast.error(err?.message || "Ağ hatası");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={loading}
        className={`px-3 py-2 bg-zinc-800 text-white rounded disabled:opacity-50 ${className}`}
      >
        {loading ? "Yükleniyor..." : label}
      </button>
    </>
  );
}
