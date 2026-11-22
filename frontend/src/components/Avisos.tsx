import { AlertTriangle, Check, Info, RotateCw, X } from "lucide-react";
import type { ReactNode } from "react";

/** Manual, p. 10: aviso informativo em fundo Água claro, com ícone. */
export function AvisoInfo({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-[1rem] bg-mares-info px-4 py-3 text-sm">
      <Info size={20} className="mt-0.5 shrink-0 text-mares-titulo" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Manual, p. 10: aviso de erro em fundo vermelho claro, com ícone.
 * RNF06 e heurística 9 de Nielsen: a mensagem diz o que houve e oferece "Tentar novamente".
 * O texto também é anunciado pela região de status do AppLayout, por isso este bloco não usa role="alert".
 */
export function AvisoErro({ mensagem, aoTentarNovamente }: { mensagem: string; aoTentarNovamente?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[1rem] bg-mares-erro px-4 py-3">
      <AlertTriangle size={20} className="shrink-0 text-mares-desfavoravel" />
      <p className="min-w-0 flex-1 text-sm">{mensagem}</p>
      {aoTentarNovamente && (
        <button type="button" className="botao" onClick={aoTentarNovamente}>
          <RotateCw size={18} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

type TipoChip = "favoravel" | "atencao" | "desfavoravel" | "neutro";

const ESTILO_CHIP: Record<TipoChip, string> = {
  favoravel: "bg-mares-favoravel text-mares-sobre-favoravel",
  atencao: "bg-mares-sol text-mares-sobre-sol",
  desfavoravel: "bg-mares-desfavoravel text-mares-sobre-desfavoravel",
  neutro: "border border-mares-borda bg-mares-superficie-alta text-mares-texto",
};

const ICONE_CHIP = { favoravel: Check, atencao: AlertTriangle, desfavoravel: X, neutro: X };

/** Cores funcionais do manual (p. 7), sempre com ícone e texto: nunca só cor (WCAG 1.4.1). */
export function Chip({ tipo, children }: { tipo: TipoChip; children: ReactNode }) {
  const Icone = ICONE_CHIP[tipo];
  return (
    <span className={`chip ${ESTILO_CHIP[tipo]}`}>
      <Icone size={14} strokeWidth={3} />
      {children}
    </span>
  );
}
