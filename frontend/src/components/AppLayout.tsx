"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { CampoBusca } from "@/src/components/CampoBusca";
import { Logo } from "@/src/components/Logo";
import { usePraia } from "@/src/components/PraiaProvider";

// ROTAS da aplicação, na ordem do protótipo web.
const ROTAS = [
  { href: "/", rotulo: "Início" },
  { href: "/hoje", rotulo: "Hoje" },
  { href: "/previsao", rotulo: "Previsão" },
  { href: "/hora-a-hora", rotulo: "Hora a hora" },
  { href: "/ajustes", rotulo: "Ajustes" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();
  const { mensagemStatus } = usePraia();

  return (
    <div className="flex min-h-screen flex-col">
      {/* WCAG 2.4.1: atalho para pular blocos repetidos */}
      <a
        href="#conteudo"
        className="absolute -top-40 left-4 z-50 rounded-lg bg-mares-primaria px-4 py-3 font-semibold text-mares-sobre-primaria focus:top-4"
      >
        Pular para o conteúdo
      </a>

      {/* Cabeçalho não fixo, para nunca encobrir o foco (WCAG 2.4.11). */}
      <header className="border-b border-mares-divisoria bg-mares-superficie">
        <div className="flex flex-wrap items-center">
          <Link href="/" className="flex min-h-16 items-center bg-mares-marca px-3 text-mares-sobre-marca sm:px-4 lg:min-h-20 lg:px-8">
            <Logo />
            <span className="sr-only">: página inicial</span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-expanded={menuAberto}
            aria-controls="menu-principal"
            className="mr-1 ml-auto inline-flex min-h-12 cursor-pointer items-center gap-1.5 rounded-lg px-2 font-semibold text-mares-titulo lg:hidden"
          >
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
            Menu
          </button>

          <nav
            id="menu-principal"
            aria-label="Principal"
            className={`${menuAberto ? "block" : "hidden"} w-full border-t border-mares-divisoria lg:block lg:w-auto lg:border-0`}
          >
            <ul className="flex flex-col px-2 py-2 lg:flex-row lg:gap-1 lg:px-6 lg:py-0">
              {ROTAS.map(({ href, rotulo }) => {
                const ativa = pathname === href;
                return (
                  <li key={href}>
                    {/* Heurística 1: a rota atual fica sublinhada e marcada com aria-current. */}
                    <Link
                      href={href}
                      aria-current={ativa ? "page" : undefined}
                      onClick={() => setMenuAberto(false)}
                      className={`flex min-h-12 items-center border-b-[3px] px-3 text-[0.9375rem] lg:min-h-20 ${
                        ativa ? "border-mares-primaria font-bold text-mares-link" : "border-transparent font-medium text-mares-titulo hover:border-mares-divisoria"
                      }`}
                    >
                      {rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="w-full px-4 py-3 lg:ml-auto lg:w-[26rem] lg:px-6">
            <CampoBusca />
          </div>
        </div>
      </header>

      {/* WCAG 4.1.3: carregamentos, resultados e erros são anunciados sem mover o foco. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {mensagemStatus}
      </div>

      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-6 sm:py-8 lg:px-8">
        {children}
      </main>

      {/* RNF04 e RNF05: aviso de navegação e atribuição sempre visíveis, como na barra do protótipo. */}
      <footer className="bg-mares-marca px-4 py-5 text-center text-sm text-mares-sobre-marca lg:px-8">
        <p>
          Dados:{" "}
          <a href="https://open-meteo.com/" className="font-semibold text-mares-agua underline underline-offset-4">
            Open-Meteo.com
          </a>{" "}
          (
          <a href="https://creativecommons.org/licenses/by/4.0/deed.pt_BR" lang="en" className="text-mares-agua underline underline-offset-4">
            CC BY 4.0
          </a>
          ) • Maré calculada por modelo. Não use para navegação.
        </p>
        <p className="mt-1">
          Mapa e praias: ©{" "}
          <a href="https://www.openstreetmap.org/copyright" className="font-semibold text-mares-agua underline underline-offset-4">
            colaboradores do OpenStreetMap
          </a>{" "}
          (ODbL)
        </p>
      </footer>
    </div>
  );
}
