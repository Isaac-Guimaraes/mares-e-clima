"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AvisoErro } from "@/src/components/Avisos";

/**
 * TRATAMENTO DE ERROS de rota (error boundary do Next.js): uma falha inesperada numa tela
 * não derruba o app; cabeçalho, busca e rodapé continuam funcionando (RNF06, heurística 9).
 */
export default function ErroDaRota({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="titulo-tela">Algo deu errado nesta tela</h1>
      <AvisoErro mensagem="Não conseguimos mostrar esta tela. Tente de novo ou volte ao início." aoTentarNovamente={reset} />
      <Link href="/" className="link">
        Voltar ao início
      </Link>
    </div>
  );
}
