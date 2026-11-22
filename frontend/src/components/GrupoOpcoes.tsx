"use client";

import { Check } from "lucide-react";

interface Opcao<T extends string> {
  valor: T;
  rotulo: string;
}

interface PropsGrupo<T extends string> {
  nome: string;
  legenda: string;
  opcoes: Opcao<T>[];
  valor: T;
  aoMudar: (valor: T) => void;
}

/**
 * Controle segmentado do protótipo (Ajustes). Por baixo são rádios nativos: setas do teclado,
 * leitor de tela e formulário funcionam sem código extra. A opção marcada leva um ✓, não só cor.
 * Heurística 5 de Nielsen: só dá para escolher valores válidos.
 */
export function GrupoOpcoes<T extends string>({ nome, legenda, opcoes, valor, aoMudar }: PropsGrupo<T>) {
  return (
    <fieldset>
      <legend className="rotulo">{legenda}</legend>
      <div className="flex flex-wrap gap-1 rounded-[0.875rem] border border-mares-borda bg-mares-fundo p-1">
        {opcoes.map((opcao) => {
          const marcada = opcao.valor === valor;
          return (
            <label
              key={opcao.valor}
              className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[0.625rem] px-3 text-[0.9375rem] font-semibold whitespace-nowrap has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mares-foco has-[:focus-visible]:outline-solid ${
                marcada ? "bg-mares-primaria text-mares-sobre-primaria" : "text-mares-titulo hover:bg-mares-superficie-alta"
              }`}
            >
              <input
                type="radio"
                name={nome}
                value={opcao.valor}
                checked={marcada}
                onChange={() => aoMudar(opcao.valor)}
                className="sr-only"
              />
              {marcada && <Check size={16} strokeWidth={3} />}
              {opcao.rotulo}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
