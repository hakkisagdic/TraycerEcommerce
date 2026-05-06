"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "../../lib/utils";
import { toast } from "sonner";
import PostEditor from "./PostEditor";

function plainTextToTipTapDoc(text: string): object {
  const value = (text ?? "").toString();
  if (!value.trim()) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  const paragraphs = value.split(/\n\n+/);
  return {
    type: "doc",
    content: paragraphs.map((p) => {
      const lines = p.split("\n");
      const inlineContent: any[] = [];
      lines.forEach((line, idx) => {
        if (line.length > 0) inlineContent.push({ type: "text", text: line });
        if (idx < lines.length - 1) inlineContent.push({ type: "hardBreak" });
      });
      return inlineContent.length === 0
        ? { type: "paragraph" }
        : { type: "paragraph", content: inlineContent };
    }),
  };
}

export default function PostForm({ initial, categories = [], tags = [] }: any) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [contentText, setContentText] = useState(initial?.contentText ?? "");

  const initialJson = useMemo<object>(() => {
    const raw = initial?.contentJson;
    const fallbackText = initial?.contentText ?? "";
    if (!raw) return plainTextToTipTapDoc(fallbackText);
    if (typeof raw === "object") return raw;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) return plainTextToTipTapDoc(fallbackText);
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") return parsed;
        return plainTextToTipTapDoc(raw);
      } catch {
        return plainTextToTipTapDoc(raw);
      }
    }
    return plainTextToTipTapDoc(fallbackText);
  }, [initial?.contentJson, initial?.contentText]);

  const [contentJson, setContentJson] = useState<object | null>(initialJson);
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [tagIds, setTagIds] = useState<string[]>(initial?.tags?.map((t: any) => t.id) ?? []);
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");

  const isSlugEdited = useRef(false);

  useEffect(() => {
    if (!isSlugEdited.current) {
      setSlug(slugify(title));
    }
  }, [title]);

  function onSlugChange(val: string) {
    isSlugEdited.current = true;
    setSlug(val);
  }

  function handleEditorChange(json: object, text: string) {
    setContentJson(json);
    setContentText(text);
  }

  async function handleSubmit(e: React.FormEvent, status = "draft") {
    e.preventDefault();

    if (!contentText.trim()) {
      toast.error("İçerik boş olamaz");
      return;
    }

    const payload: any = {
      title,
      slug,
      contentText,
      contentJson: JSON.stringify(contentJson ?? initialJson),
      status,
      categoryId: categoryId || null,
      tagIds,
      featuredImage: featuredImage || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
    };

    const method = initial?.id ? "PUT" : "POST";
    const url = initial?.id ? `/api/posts/${initial.id}` : "/api/posts";

    try {
      const res = await fetch(url, { method, body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        toast.success("Yazı kaydedildi");
        router.push("/admin/posts");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.message || "Kaydetme sırasında hata oluştu");
      }
    } catch (err: any) {
      toast.error(err?.message || "Ağ hatası");
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <label className="block text-sm">Başlık</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 bg-white/5 rounded" />

        <label className="block text-sm mt-4">Slug</label>
        <input value={slug} onChange={(e) => onSlugChange(e.target.value)} className="w-full p-2 bg-white/5 rounded" />

        <label className="block text-sm mt-4">İçerik</label>
        <PostEditor initialContent={initialJson} onChange={handleEditorChange} />
      </div>

      <aside className="col-span-1">
        <div className="bg-white/5 p-4 rounded">
          <label className="block text-sm">Kategori</label>
          <select value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value || null)} className="w-full p-2 bg-white/5 rounded">
            <option value="">Seçiniz</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="block text-sm mt-4">Etiketler</label>
          <div className="flex flex-col gap-1 max-h-40 overflow-auto">
            {tags.map((t: any) => (
              <label key={t.id} className="text-sm">
                <input
                  type="checkbox"
                  checked={tagIds.includes(t.id)}
                  onChange={(e) => {
                    if (e.currentTarget.checked) setTagIds((s) => Array.from(new Set([...s, t.id])));
                    else setTagIds((s) => s.filter((id) => id !== t.id));
                  }}
                />
                {" "}
                {t.name}
              </label>
            ))}
          </div>

          <label className="block text-sm mt-4">Öne Çıkan Görsel URL</label>
          <input value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} className="w-full p-2 bg-white/5 rounded" />

          <label className="block text-sm mt-4">SEO Başlığı</label>
          <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="w-full p-2 bg-white/5 rounded" />

          <label className="block text-sm mt-4">SEO Açıklama</label>
          <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="w-full p-2 bg-white/5 rounded" />

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={(e) => handleSubmit(e as any, "draft")} className="px-3 py-2 bg-zinc-800 rounded">
              Taslak Kaydet
            </button>
            <button type="button" onClick={(e) => handleSubmit(e as any, "published")} className="px-3 py-2 bg-blue-600 rounded">
              Yayınla
            </button>
          </div>
        </div>
      </aside>
    </form>
  );
}
