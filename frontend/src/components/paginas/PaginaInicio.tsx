"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarCheck, LocateFixed, Map as MapIcon, Search, Waves } from "lucide-react";
import { GrafismoOndas } from "@/src/components/Logo";
import { ListaLocais } from "@/src/components/ListaLocais";
import { usePraia } from "@/src/components/PraiaProvider";
import type { Localidade } from "@/src/lib/tipos";

const PASSOS = [
  { Icone: Search, titulo: "Encontre a praia", texto: "Pelo nome na busca do topo, pela sua localização ou no mapa." },
  { Icone: Waves, titulo: "Veja maré e tempo", texto: "Curva de maré, ondas, chuva, vento e sol do dia." },
  { Icone: CalendarCheck, titulo: "Escolha a hora", texto: "Destacamos os horários que atendem aos seus critérios." },
];

/** Rota "/" (Início), como no protótipo: apresentação, praia atual e favoritas. */
export function PaginaInicio() {
  const router = useRouter();
  const { consulta, favoritos, selecionarPraia, ultimaFavoritaRemovida, desfazerRemocaoFavorita } = usePraia();
  const botaoDesfazer = useRef<HTMLButtonElement>(null);

  const removidaVisivel = ultimaFavoritaRemovida && !favoritos.some((f) => f.id === ultimaFavoritaRemovida.id) ? ultimaFavoritaRemovida : null;

  // O card removido levou o foco junto: ele vai para "Desfazer", a ação mais provável (WCAG 2.4.3).
  useEffect(() => {
    if (removidaVisivel && document.activeElement === document.body) botaoDesfazer.current?.focus();
  }, [removidaVisivel]);

  function abrir(localidade: Localidade) {
    selecionarPraia(localidade);
    router.push("/hoje");
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="titulo-inicio" className="relative overflow-hidden rounded-[1.25rem] bg-mares-marca px-6 pt-10 pb-28 text-mares-sobre-marca sm:px-10 lg:pt-14">
        <p className="text-sm font-semibold tracking-wider text-mares-agua uppercase">A hora certa de ir à praia</p>
        <h1 id="titulo-inicio" className="mt-2 max-w-3xl font-titulo text-4xl leading-[1.1] font-black sm:text-5xl lg:text-6xl">
          Planeje seu dia de praia com marés e clima
        </h1>
        <p className="mt-4 max-w-xl text-lg">Maré, ondas, tempo e os melhores horários da sua praia, em um só lugar.</p>
        {/* Heurística 7: dois caminhos rápidos além da busca por nome. */}
        <div className="relative z-10 mt-6 flex flex-wrap gap-3">
          <Link href="/busca?perto=1" className="botao border-mares-superficie bg-mares-superficie text-mares-titulo">
            <LocateFixed size={18} />
            Praias perto de mim
          </Link>
          <Link href="/busca" className="botao border-mares-agua bg-transparent text-mares-sobre-marca hover:bg-mares-titulo/20">
            <MapIcon size={18} />
            Explorar no mapa
          </Link>
        </div>
        <GrafismoOndas className="absolute bottom-0 left-0 h-24 w-full" />
      </section>

      {consulta && (
        <section aria-labelledby="titulo-continuar" className="cartao flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="titulo-continuar" className="titulo-secao">
              Continuar com {consulta.localidade.nome}
            </h2>
            <p className="dica">Última praia consultada neste navegador.</p>
          </div>
          <Link href="/hoje" className="botao botao-primario">
            Ver hoje
            <ArrowRight size={18} />
          </Link>
        </section>
      )}

      <section aria-labelledby="titulo-favoritas" className="space-y-4">
        <h2 id="titulo-favoritas" className="titulo-secao">
          Suas praias favoritas
        </h2>

        {/* Heurística 3 de Nielsen: remover uma favorita sem querer tem volta. */}
        {removidaVisivel && (
          <p className="flex flex-wrap items-center gap-3 rounded-[1rem] bg-mares-info px-4 py-2">
            <span>{removidaVisivel.nome} foi removida das favoritas.</span>
            <button ref={botaoDesfazer} type="button" className="link cursor-pointer" onClick={desfazerRemocaoFavorita}>
              Desfazer
            </button>
          </p>
        )}

        {favoritos.length > 0 ? (
          <ListaLocais localidades={favoritos} aoSelecionar={abrir} acao="ver condições de hoje" emGrade />
        ) : (
          <p className="cartao dica">Busque uma praia e toque em “Favoritar” para encontrá-la aqui na próxima visita.</p>
        )}
      </section>

      {/* Heurística 10 de Nielsen: ajuda curta, no lugar em que o usuário começa. */}
      <section aria-labelledby="titulo-como" className="space-y-4">
        <h2 id="titulo-como" className="titulo-secao">
          Como funciona
        </h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {PASSOS.map(({ Icone, titulo, texto }, i) => (
            <li key={titulo} className="cartao flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mares-info text-mares-titulo">
                <Icone size={22} />
              </span>
              <span>
                <span className="block font-semibold text-mares-titulo">
                  {i + 1}. {titulo}
                </span>
                <span className="dica">{texto}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
