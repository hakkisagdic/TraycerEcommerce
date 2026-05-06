import { RegisterForm } from "./register-form";

export const metadata = {
  title: "Kayıt Ol",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center">
      <div className="w-full space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Kayıt Ol</h1>
          <p className="text-sm text-muted-foreground">
            Yorum yapabilmek için bir okuyucu hesabı oluşturun.
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
