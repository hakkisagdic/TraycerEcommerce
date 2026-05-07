"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

export default function SearchBar() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams?.get("q") ?? "";
  const [value, setValue] = React.useState(urlQuery);

  React.useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  return (
    <form action="/search" method="get" className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur">
      <input
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ara..."
        className="w-40 rounded-full border-0 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none md:w-64"
      />
      <button
        type="submit"
        className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Ara
      </button>
    </form>
  );
}
