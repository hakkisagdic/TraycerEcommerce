import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Giriş Yap",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center">
      <div className="w-full space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Giriş Yap</h1>
          <p className="text-sm text-muted-foreground">
            E-posta ve parolanızla hesabınıza giriş yapın.
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm callbackUrl={sp.callbackUrl} />
        </Suspense>
      </div>
    </div>
  );
}
