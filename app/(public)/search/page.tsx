import PostPreview from "../../../components/public/PostPreview";
import { searchPostsForListing } from "../../../lib/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: any;
}) {
  const q =
    typeof searchParams?.q === "string" ? searchParams.q.trim() : "";

  if (!q) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-6">Arama</h1>
        <p className="text-zinc-400">Aramak için bir kelime girin.</p>
      </div>
    );
  }

  const items = await searchPostsForListing(q);

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-2">Arama Sonuçları</h1>
      <p className="text-sm text-zinc-400 mb-6">
        <span className="font-mono">&quot;{q}&quot;</span> için {items.length} sonuç
      </p>

      {items.length === 0 ? (
        <p className="text-zinc-300">
          <strong>{q}</strong> için sonuç bulunamadı.
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((p) => (
            // @ts-ignore
            <PostPreview key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
