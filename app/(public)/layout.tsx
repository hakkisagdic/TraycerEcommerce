import Link from "next/link";
import SearchBar from "../../components/public/SearchBar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-zinc-800">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold">
            My Blog
          </Link>
          <SearchBar />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4">{children}</main>
    </div>
  );
}
