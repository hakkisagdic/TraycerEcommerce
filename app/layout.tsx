import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blog CMS",
  description: "Minimal Next.js blog CMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
