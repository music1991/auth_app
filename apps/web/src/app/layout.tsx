
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Auth (Demo)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <main className="">
          {children}
          <Toaster position="top-right" richColors />
        </main>
      </body>
    </html>
  );
}