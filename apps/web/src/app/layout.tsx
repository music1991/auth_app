import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "T Improve",
  description: "",
  robots: "noindex, nofollow", // Para desarrollo
};

// Prevenir cache en el layout
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Prevenir cache en clientes */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body suppressHydrationWarning>
        <main className="min-h-screen bg-white">
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton 
            duration={4000}
            toastOptions={{
              style: {
                fontSize: '14px',
              },
            }}
          />
        </main>
        
        {/* Script para prevenir cache del navegador */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevenir cache al navegar con back/forward
              window.onpageshow = function(event) {
                if (event.persisted) {
                  window.location.reload();
                }
              };
              
              // Prevenir re-submit de forms
              if (window.history.replaceState) {
                window.history.replaceState(null, null, window.location.href);
              }
            `
          }}
        />
      </body>
    </html>
  );
}