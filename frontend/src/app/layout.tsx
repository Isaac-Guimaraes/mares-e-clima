import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";

// Manual de Identidade Visual, p. 8: Nunito nos títulos e Inter nos textos.
const nunito = Nunito({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-nunito" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Cada rota define seu título; o modelo completa com o nome do app (WCAG 2.4.2).
export const metadata: Metadata = {
  title: { default: "Marés e Clima", template: "%s · Marés e Clima" },
  description: "Previsão de marés e do tempo para praias do Brasil. A hora certa de ir à praia.",
};

// Aplica o tema salvo antes da primeira pintura, para não piscar o tema errado.
const SCRIPT_TEMA = `try{var t=JSON.parse(localStorage.getItem("mares-e-clima:tema"));if(t==="claro"||t==="escuro")document.documentElement.dataset.tema=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="bg-mares-fundo font-sans text-mares-texto antialiased">
        <Script id="tema-salvo" strategy="beforeInteractive">
          {SCRIPT_TEMA}
        </Script>
        {children}
      </body>
    </html>
  );
}
