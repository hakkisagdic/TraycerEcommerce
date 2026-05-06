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
    <form action="/search" method="get" className="flex items-center gap-2">
      <input
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ara..."
        className="px-3 py-2 bg-zinc-800 rounded text-sm w-48 md:w-64"
      />
      <button
        type="submit"
        className="px-3 py-2 bg-zinc-800 rounded text-sm hover:bg-zinc-700"
      >
        Ara
      </button>
    </form>
  );
}
