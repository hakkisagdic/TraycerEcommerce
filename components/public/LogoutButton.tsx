"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-zinc-300 hover:text-white"
    >
      Çıkış Yap
    </button>
  );
}
