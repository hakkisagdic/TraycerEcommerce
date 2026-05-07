import Link from "next/link";
import type { Metadata } from "next";

import { prisma } from "../../lib/prisma";
import PostPreview from "../../components/public/PostPreview";
import Pagination from "../../components/public/Pagination";

export const metadata: Metadata = {
  title: "Blog",
  description: "Son yazılar",
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string; limit?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page ?? 1));
  const limit = Math.min(20, Math.max(1, Number(sp?.limit ?? 10)));

  const where: any = { status: "published" };

  const [items, total, categories, tags] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { author: { select: { id: true, name: true } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, take: 10 }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const stats = [
    { label: "Yazı", value: total },
    { label: "Kategori", value: categories.length },
    { label: "Etiket", value: tags.length },
  ];

  return (
    <div className="space-y-10 py-8 md:py-12">
      <section className="grid gap-6 rounded-[32px] border border-zinc-200/80 bg-white/80 p-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur md:grid-cols-[1.2fr_0.8fr] md:p-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
            Minimal CMS Blog
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
              Yazılar, kategoriler ve etiketler için daha sakin bir okuma deneyimi.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
              Son yayınları, öne çıkan kategorileri ve popüler etiketleri tek bir düzen içinde keşfet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="#posts"
              className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Yazılara git
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950"
            >
              Araştır
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-[28px] border border-zinc-200 bg-zinc-950 p-6 text-white shadow-[0_24px_70px_-40px_rgba(15,23,42,0.75)]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">Canlı durum</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">Bugün okunacak içerikler</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-2xl font-semibold">{stat.value}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-zinc-300">
            Arama, kategori gezintisi ve içerik önizlemeleri tek bir akışta toplanmış durumda.
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-zinc-500">Son yayınlar</p>
              <h2 id="posts" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
                Öne çıkan içerikler
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-zinc-500">
              En son yayınlanan içerikler, okunabilir kart yapısıyla listeleniyor.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {items.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white/70 p-10 text-center shadow-sm">
                <p className="text-lg font-medium text-zinc-950">Henüz yayınlanmış yazı yok.</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  İlk içerikler eklendiğinde burada daha dolu bir akış göreceksin.
                </p>
              </div>
            ) : (
              items.map((p) => (
                // @ts-ignore
                <PostPreview key={p.id} post={p} />
              ))
            )}
          </div>

          {/* @ts-ignore */}
          <Pagination page={page} totalPages={totalPages} />
        </div>

        <aside className="space-y-6 xl:pt-10">
          <section className="rounded-[28px] border border-zinc-200 bg-white/80 p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Kategoriler
            </h2>
            {categories.length === 0 ? (
              <p className="text-sm leading-6 text-zinc-500">Henüz kategori yok.</p>
            ) : (
              <ul className="space-y-2">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/categories/${c.slug}`}
                      className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950"
                    >
                      <span>{c.name}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white/80 p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Popüler Etiketler
            </h2>
            {tags.length === 0 ? (
              <p className="text-sm leading-6 text-zinc-500">Henüz etiket yok.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tags/${t.slug}`}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-white hover:text-zinc-950"
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
