"use client";

import { useRef, type KeyboardEvent } from "react";
import * as fmt from "@/src/lib/formatacao";

interface PropsSeletor {
  id: string;
  dias: string[];
  hoje: string;
  selecionado: string;
  aoSelecionar: (data: string) => void;
  rotulo: string;
}

/**
 * Abas de dia ("Hoje", "Amanhã", "Qui"...), no padrão Tabs do WAI-ARIA APG:
 * setas esquerda/direita, Home e End trocam de aba; Tab entra no painel.
 */
export function SeletorDia({ id, dias, hoje, selecionado, aoSelecionar, rotulo }: PropsSeletor) {
  const abas = useRef<Array<HTMLButtonElement | null>>([]);

  function handleTeclado(e: KeyboardEvent, indice: number) {
    const ultimo = dias.length - 1;
    const destino =
      e.key === "ArrowRight" ? (indice === ultimo ? 0 : indice + 1)
      : e.key === "ArrowLeft" ? (indice === 0 ? ultimo : indice - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? ultimo
      : null;
    if (destino === null) return;
    e.preventDefault();
    const data = dias[destino];
    if (data) aoSelecionar(data);
    abas.current[destino]?.focus();
  }

  return (
    <div role="tablist" aria-label={rotulo} className="flex gap-1 overflow-x-auto border-b border-mares-divisoria">
      {dias.map((data, i) => {
        const ativo = data === selecionado;
        return (
          <button
            key={data}
            ref={(el) => {
              abas.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-aba-${data}`}
            aria-selected={ativo}
            aria-controls={`${id}-painel`}
            tabIndex={ativo ? 0 : -1}
            onClick={() => aoSelecionar(data)}
            onKeyDown={(e) => handleTeclado(e, i)}
            className={`-mb-px min-h-12 shrink-0 cursor-pointer border-b-[3px] px-4 text-[0.9375rem] ${
              ativo ? "border-mares-primaria font-bold text-mares-link" : "border-transparent font-medium text-mares-texto hover:border-mares-divisoria"
            }`}
          >
            {fmt.rotuloDia(data, hoje)}
            <span className="sr-only">, {fmt.dataPorExtenso(data)}</span>
          </button>
        );
      })}
    </div>
  );
}
