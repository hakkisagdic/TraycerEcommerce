"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

type CommentItem = {
  id: string;
  content: string;
  status: string;
  createdAt: string | Date;
  author?: { id: string; name?: string | null } | null;
};

type Props = {
  postId: string;
  initialComments: CommentItem[];
  isLoggedIn: boolean;
};

export default function CommentSection({ postId, initialComments, isLoggedIn }: Props) {
  const pathname = usePathname();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const approved = initialComments.filter((c) => c.status === "approved");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      setError("Yorum boş olamaz.");
      return;
    }

    setIsPending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as any)?.error ?? "Yorum gönderilemedi.");
        return;
      }

      setContent("");
      setSuccess("Yorumunuz onay bekliyor.");
    } catch {
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="mt-10 border-t border-zinc-800 pt-8">
      <h2 className="text-xl font-semibold mb-4">Yorumlar</h2>

      {approved.length === 0 ? (
        <p className="text-zinc-400">Henüz yorum yok. İlk yorumu sen yap.</p>
      ) : (
        <ul className="space-y-4">
          {approved.map((c) => (
            <li key={c.id} className="border border-zinc-800 rounded p-4">
              <div className="text-sm text-zinc-400 mb-1">
                <span className="font-medium text-zinc-200">
                  {c.author?.name ?? "Anonim"}
                </span>
                {" • "}
                {new Date(c.createdAt).toLocaleDateString()}
              </div>
              <p className="text-zinc-100 whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Yorum Yap</h3>

        {!isLoggedIn ? (
          <p className="text-zinc-300">
            Yorum yapabilmek için{" "}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(pathname ?? "/")}`}
              className="text-blue-400 hover:underline"
            >
              giriş yapın
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Yorumunuzu yazın..."
              rows={4}
              disabled={isPending}
              className="w-full px-3 py-2 bg-zinc-800 rounded text-sm"
            />
            {error ? (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            ) : null}
            {success ? (
              <p role="status" className="text-sm text-green-400">
                {success}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm disabled:opacity-50"
            >
              {isPending ? "Gönderiliyor..." : "Gönder"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
