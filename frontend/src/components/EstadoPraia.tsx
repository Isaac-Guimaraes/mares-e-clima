"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { AvisoErro } from "@/src/components/Avisos";
import { usePraia, type PraiaConsultada } from "@/src/components/PraiaProvider";

/** Esqueleto de carregamento: mostra o formato do que vem, em vez de uma tela vazia (heurística 1). */
export function Esqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-[1.25rem] bg-mares-superficie-alta" />
      ))}
    </div>
  );
}

interface PropsEstado {
  /** Título da tela quando ainda não há praia (cada rota tem um h1 próprio). */
  titulo: string;
  children: (consulta: PraiaConsultada) => ReactNode;
}

/**
 * LOADING, ERRO e VAZIO das telas que dependem de uma praia (Hoje, Previsão, Hora a hora).
 * O mesmo componente em todas as rotas garante o mesmo comportamento (heurística 4 de Nielsen).
 */
export function EstadoPraia({ titulo, children }: PropsEstado) {
  const { consulta, carregandoPraia, erro, tentarNovamente } = usePraia();

  if (!consulta) {
    return (
      <div className="space-y-6">
        <h1 className="titulo-tela">{titulo}</h1>
        {carregandoPraia ? (
          <div aria-busy="true" className="space-y-3">
            <p className="font-semibold">Carregando maré e clima de {carregandoPraia.nome}…</p>
            <Esqueleto />
          </div>
        ) : erro ? (
          <AvisoErro mensagem={erro} aoTentarNovamente={tentarNovamente} />
        ) : (
          <div className="cartao max-w-2xl space-y-3">
            <p className="titulo-secao">Nenhuma praia escolhida</p>
            <p>Use a busca no topo da página para encontrar sua praia. Ela fica salva para as próximas visitas.</p>
            <p className="flex items-center gap-2 text-sm text-mares-suave">
              <Search size={16} />
              Exemplos: Itapuã, Copacabana, Porto de Galinhas.
            </p>
            <Link href="/" className="link">
              Ver suas praias favoritas
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-busy={carregandoPraia ? true : undefined}>
      {/* Uma nova consulta falhou: os dados anteriores continuam na tela, com o aviso e a saída. */}
      {erro && <AvisoErro mensagem={erro} aoTentarNovamente={tentarNovamente} />}
      {carregandoPraia && (
        <p className="chip bg-mares-info text-mares-titulo">Atualizando {carregandoPraia.nome}…</p>
      )}
      {children(consulta)}
    </div>
  );
}
