"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { usePraia } from "@/src/components/PraiaProvider";

// Com menos de 3 letras a Geocoding API só aceita nome exato e quase nunca encontra algo.
export const MINIMO_LETRAS = 3;

/** Busca do cabeçalho, presente em todas as telas (protótipo; heurística 4 de Nielsen). Leva à rota /busca. */
export function CampoBusca() {
  const router = useRouter();
  const { anunciar } = usePraia();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    const termo = texto.trim();
    // Heurística 5 (prevenção de erros): valida antes de gastar uma consulta que não encontraria nada.
    if (termo.length < MINIMO_LETRAS) {
      const mensagem = `Digite pelo menos ${MINIMO_LETRAS} letras do nome da praia ou cidade.`;
      setErro(mensagem);
      anunciar(mensagem);
      campo.current?.focus();
      return;
    }
    router.push(`/busca?q=${encodeURIComponent(termo)}`);
  }

  function limpar() {
    setTexto("");
    setErro(null);
    campo.current?.focus();
  }

  return (
    <form role="search" onSubmit={handleBuscar} noValidate className="w-full">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="campo-busca" className="sr-only">
            Buscar praia ou cidade
          </label>
          <Search size={20} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-mares-suave" />
          <input
            ref={campo}
            id="campo-busca"
            type="search"
            autoComplete="off"
            spellCheck={false}
            maxLength={100}
            placeholder="Buscar praia"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setErro(null);
            }}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? "erro-busca" : undefined}
            className="entrada pr-12 pl-11 [&::-webkit-search-cancel-button]:hidden"
          />
          {/* Heurística 3: um toque limpa o campo (o "X" do protótipo). */}
          {texto && (
            <button
              type="button"
              onClick={limpar}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-1 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-mares-suave hover:text-mares-texto"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <button type="submit" className="botao botao-primario">
          Buscar
        </button>
      </div>
      {erro && (
        <p id="erro-busca" className="mt-1 text-sm font-semibold text-mares-desfavoravel">
          {erro}
        </p>
      )}
    </form>
  );
}
