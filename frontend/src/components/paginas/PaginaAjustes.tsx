"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { AvisoInfo } from "@/src/components/Avisos";
import { GrupoOpcoes } from "@/src/components/GrupoOpcoes";
import { usePraia } from "@/src/components/PraiaProvider";
import { DIAS_PERMITIDOS, normalizarCriterios, PREFERENCIAS_PADRAO, type Preferencias, type Tema } from "@/src/lib/preferencias";
import type { PreferenciaMare } from "@/src/lib/tipos";

const OPCOES_DIAS = DIAS_PERMITIDOS.map((d) => ({ valor: String(d), rotulo: d === 1 ? "1 dia" : `${d} dias` }));
const OPCOES_MARE: { valor: PreferenciaMare; rotulo: string }[] = [
  { valor: "indiferente", rotulo: "Indiferente" },
  { valor: "baixa", rotulo: "Maré baixa" },
  { valor: "alta", rotulo: "Maré alta" },
];
const OPCOES_TEMA: { valor: Tema; rotulo: string }[] = [
  { valor: "claro", rotulo: "Claro" },
  { valor: "escuro", rotulo: "Escuro" },
  { valor: "sistema", rotulo: "Sistema" },
];

interface Campos {
  dias: string;
  chuvaMax: string;
  ventoMax: string;
  mare: PreferenciaMare;
  tema: Tema;
}

function paraCampos(p: Preferencias): Campos {
  return {
    dias: String(p.dias),
    chuvaMax: String(p.criterios.probabilidadeChuvaMax),
    ventoMax: String(p.criterios.ventoMaxKmh),
    mare: p.criterios.preferenciaMare,
    tema: p.tema,
  };
}

function CampoNumero(props: { id: string; rotulo: string; unidade: string; limite: string; valor: string; aoMudar: (v: string) => void; max: number; passo: number }) {
  const { id, rotulo, unidade, limite, valor, aoMudar, max, passo } = props;
  return (
    <div>
      <label htmlFor={id} className="rotulo">
        {rotulo} <span className="sr-only">({unidade})</span>
      </label>
      <div className="flex max-w-xs items-stretch overflow-hidden rounded-[0.875rem] border border-mares-borda bg-mares-fundo focus-within:border-mares-primaria">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          step={passo}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          aria-describedby={`${id}-limite`}
          className="min-h-12 w-full min-w-0 bg-transparent px-4 text-base"
        />
        <span aria-hidden="true" className="flex items-center bg-mares-superficie-alta px-4 font-semibold text-mares-titulo">
          {unidade}
        </span>
      </div>
      <p id={`${id}-limite`} className="dica mt-1">
        {limite}
      </p>
    </div>
  );
}

function Formulario({ inicial }: { inicial: Preferencias }) {
  const { atualizarPreferencias } = usePraia();
  const [campos, setCampos] = useState<Campos>(() => paraCampos(inicial));
  const [salvos, setSalvos] = useState<Campos>(() => paraCampos(inicial));
  const [ajustes, setAjustes] = useState<string[]>([]);
  const mudar = <K extends keyof Campos>(chave: K, valor: Campos[K]) => setCampos((c) => ({ ...c, [chave]: valor }));

  // Heurística 1: o usuário vê que tem alterações ainda não aplicadas.
  const alterado = JSON.stringify(campos) !== JSON.stringify(salvos);

  function handleSalvar(e: FormEvent) {
    e.preventDefault();
    const criterios = normalizarCriterios({ probabilidadeChuvaMax: campos.chuvaMax, ventoMaxKmh: campos.ventoMax, preferenciaMare: campos.mare });
    const novas: Preferencias = { dias: Number(campos.dias), criterios, tema: campos.tema };
    // Heurística 5: valores fora da faixa são corrigidos e o usuário é avisado do que mudou.
    const corrigidos = [
      String(criterios.probabilidadeChuvaMax) !== campos.chuvaMax.trim() ? `Chuva ajustada para ${criterios.probabilidadeChuvaMax}%.` : null,
      String(criterios.ventoMaxKmh) !== campos.ventoMax.trim() ? `Vento ajustado para ${criterios.ventoMaxKmh} km/h.` : null,
    ].filter((m): m is string => m !== null);
    const finais = paraCampos(novas);
    setCampos(finais);
    setSalvos(finais);
    setAjustes(corrigidos);
    atualizarPreferencias(novas);
  }

  return (
    <form onSubmit={handleSalvar} noValidate className="cartao space-y-6">
      <GrupoOpcoes nome="dias" legenda="Dias de previsão" opcoes={OPCOES_DIAS} valor={campos.dias} aoMudar={(v) => mudar("dias", v)} />
      <CampoNumero id="campo-chuva" rotulo="Chuva aceitável até" unidade="%" limite="De 0 a 100." max={100} passo={5} valor={campos.chuvaMax} aoMudar={(v) => mudar("chuvaMax", v)} />
      <CampoNumero id="campo-vento" rotulo="Vento aceitável até" unidade="km/h" limite="De 0 a 150." max={150} passo={1} valor={campos.ventoMax} aoMudar={(v) => mudar("ventoMax", v)} />
      <GrupoOpcoes nome="mare" legenda="Preferência de maré" opcoes={OPCOES_MARE} valor={campos.mare} aoMudar={(v) => mudar("mare", v)} />
      <GrupoOpcoes nome="tema" legenda="Tema" opcoes={OPCOES_TEMA} valor={campos.tema} aoMudar={(v) => mudar("tema", v)} />

      {ajustes.length > 0 && <AvisoInfo>{ajustes.join(" ")}</AvisoInfo>}

      <div className="space-y-3">
        {alterado && (
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle size={18} className="text-mares-desfavoravel" />
            Você tem alterações não salvas.
          </p>
        )}
        <button type="submit" className="botao botao-primario w-full">
          Salvar preferências
        </button>
        {/* Heurística 3: volta aos valores do escopo; nada muda até salvar. */}
        <button type="button" className="botao w-full" onClick={() => setCampos(paraCampos(PREFERENCIAS_PADRAO))}>
          Restaurar padrão
        </button>
      </div>
    </form>
  );
}

/** Rota "/ajustes" — critérios de recomendação (RF08) e tema, como na tela "Ajustes" do protótipo. */
export function PaginaAjustes() {
  const { preferencias, preferenciasProntas } = usePraia();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="space-y-4">
        <h1 className="titulo-tela">Preferências de recomendação</h1>
        <p className="text-lg text-mares-suave">Personalize os critérios para receber recomendações mais relevantes.</p>
        <AvisoInfo>
          Um horário é favorável quando está entre o nascer e o pôr do sol e atende aos limites de chuva, vento e maré daqui. As
          preferências ficam salvas neste navegador.
        </AvisoInfo>
      </div>
      {/* key: o formulário recomeça só quando o localStorage é lido, para salvar não tirar o foco do botão. */}
      <Formulario key={String(preferenciasProntas)} inicial={preferencias} />
    </div>
  );
}
