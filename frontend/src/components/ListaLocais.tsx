"use client";

import { MapPin, Star } from "lucide-react";
import { usePraia } from "@/src/components/PraiaProvider";
import type { Localidade } from "@/src/lib/tipos";

/**
 * Favoritar (RF09). O texto visível muda ("Favoritar" → "Favoritada") e a estrela enche:
 * o estado é dito em palavras, não só pela cor ou pela forma (WCAG 1.4.1 e 4.1.2).
 */
export function BotaoFavorito({ localidade }: { localidade: Localidade }) {
  const { favoritos, alternarFavorito } = usePraia();
  const favorita = favoritos.some((l) => l.id === localidade.id);

  return (
    <button
      type="button"
      className={`botao shrink-0 ${favorita ? "border-mares-favoravel text-mares-favoravel" : ""}`}
      onClick={() => alternarFavorito(localidade)}
    >
      <Star size={18} fill={favorita ? "currentColor" : "none"} />
      {favorita ? "Favoritada" : "Favoritar"}
      <span className="sr-only">: {localidade.nome}</span>
    </button>
  );
}

export function descreverLocal(l: Localidade): string {
  return [l.municipio !== l.nome ? l.municipio : undefined, l.estado].filter(Boolean).join(", ");
}

interface PropsLista {
  localidades: Localidade[];
  aoSelecionar: (localidade: Localidade) => void;
  /** Texto da ação principal, dito ao leitor de tela junto com o nome. */
  acao: string;
  emGrade?: boolean;
  /** Informação extra por praia, como a distância até o usuário. */
  detalhe?: (localidade: Localidade) => string | undefined;
}

/** Praias em cards: o card inteiro é um botão grande (fácil de tocar) e a favorita fica ao lado. */
export function ListaLocais({ localidades, aoSelecionar, acao, emGrade = false, detalhe }: PropsLista) {
  return (
    <ul className={`grid gap-3 ${emGrade ? "sm:grid-cols-2 xl:grid-cols-3" : ""}`}>
      {localidades.map((localidade) => {
        const complemento = [descreverLocal(localidade), detalhe?.(localidade)].filter(Boolean).join(" · ");
        return (
          <li key={localidade.id} className="cartao flex flex-wrap items-center gap-3 p-3! sm:p-4!">
            <button
              type="button"
              onClick={() => aoSelecionar(localidade)}
              className="flex min-h-12 min-w-0 flex-[1_1_12rem] cursor-pointer flex-col items-start rounded-lg px-2 py-1 text-left hover:bg-mares-superficie-alta"
            >
              <span className="font-titulo text-xl font-extrabold text-mares-titulo">{localidade.nome}</span>
              {complemento && (
                <span className="flex items-center gap-1 text-sm text-mares-suave">
                  <MapPin size={14} />
                  {complemento}
                </span>
              )}
              <span className="sr-only">: {acao}</span>
            </button>
            <BotaoFavorito localidade={localidade} />
          </li>
        );
      })}
    </ul>
  );
}
