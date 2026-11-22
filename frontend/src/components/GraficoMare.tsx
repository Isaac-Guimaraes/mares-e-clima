"use client";

import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import * as fmt from "@/src/lib/formatacao";
import type { ExtremoMare, HoraCondicao, PeriodoFavoravel } from "@/src/lib/tipos";

// Manual, p. 7: curva em Maré (3 px), área em Água (45%), melhor horário em faixa de Sol, noite em sombra leve.
const COR_CURVA = "var(--color-mares-primaria)";
const COR_TEXTO = "var(--color-mares-texto)";
const COR_EIXO = "var(--color-mares-suave)";

interface PropsGrafico {
  id: string;
  /** Horas de um único dia. */
  horas: HoraCondicao[];
  extremos: ExtremoMare[];
  janelas: PeriodoFavoravel[];
  nascerDoSol: string | null;
  porDoSol: string | null;
  /** Hora cheia atual ("AAAA-MM-DDTHH:00") quando o dia exibido é hoje. */
  agora: string | null;
  horarioAgora: string;
  /** Mesma escala em todos os dias, para comparar as marés entre abas. */
  dominio: [number, number];
}

/** Triângulo cheio para maré alta e vazado para baixa (manual, p. 7), com horário e tipo escritos. */
function MarcadorMare({ cx = 0, cy = 0, extremo }: { cx?: number; cy?: number; extremo: ExtremoMare }) {
  const alta = extremo.tipo === "alta";
  const pontos = alta
    ? `${cx},${cy - 8} ${cx - 8},${cy + 6} ${cx + 8},${cy + 6}`
    : `${cx},${cy + 8} ${cx - 8},${cy - 6} ${cx + 8},${cy - 6}`;
  const yTexto = alta ? cy - 30 : cy + 26;
  return (
    <g className="marcador-mare">
      <polygon points={pontos} fill={alta ? COR_CURVA : "var(--color-mares-superficie)"} stroke={COR_CURVA} strokeWidth={2.5} />
      <text x={cx} y={yTexto} textAnchor="middle" fontSize={14} fontWeight={700} fill={COR_TEXTO}>
        {fmt.hora(extremo.horario)}
      </text>
      <text x={cx} y={yTexto + 15} textAnchor="middle" fontSize={12} fill={COR_TEXTO}>
        {alta ? "maré alta" : "maré baixa"}
      </text>
    </g>
  );
}

/** "AAAA-MM-DDTHH:MM" → hora cheia correspondente que existe no eixo. */
function horaCheia(horario: string): string {
  return `${horario.slice(0, 13)}:00`;
}

function descrever(horas: HoraCondicao[], extremos: ExtremoMare[], janelas: PeriodoFavoravel[]): string {
  const data = horas[0]?.horario.slice(0, 10) ?? "";
  const lista = extremos.map((e) => `maré ${e.tipo} às ${fmt.hora(e.horario)} (${fmt.metros(e.alturaM, 2)})`).join("; ");
  const melhores = janelas.map((j) => `das ${fmt.hora(j.inicio)} às ${fmt.hora(j.fim)}`).join(" e ");
  return (
    `Curva do nível do mar em ${fmt.dataPorExtenso(data)}. ` +
    (lista ? `${lista.charAt(0).toUpperCase()}${lista.slice(1)}. ` : "Sem marés alta ou baixa identificadas. ") +
    (melhores ? `Melhor horário: ${melhores}. ` : "Nenhum horário favorável. ") +
    "Os mesmos dados estão na tabela a seguir."
  );
}

/** RF02, RF03 e RF08 — Curva de maré do dia com extremos, noite, melhores horários e "Agora". */
export function GraficoMare({ id, horas, extremos, janelas, nascerDoSol, porDoSol, agora, horarioAgora, dominio }: PropsGrafico) {
  const comNivel = horas.filter((h) => h.nivelMarM !== null);
  if (comNivel.length < 2) {
    return <p>Não há dados de maré suficientes para desenhar o gráfico neste ponto.</p>;
  }

  const categorias = new Set(horas.map((h) => h.horario));
  const primeira = horas[0]!.horario;
  const ultima = horas[horas.length - 1]!.horario;
  const ticksX = horas.filter((h) => Number(h.horario.slice(11, 13)) % 4 === 0).map((h) => h.horario);
  const passo = (dominio[1] - dominio[0]) / 4;
  const ticksY = Array.from({ length: 5 }, (_, i) => dominio[0] + passo * i);
  const nascer = nascerDoSol ? horaCheia(nascerDoSol) : null;
  const por = porDoSol ? horaCheia(porDoSol) : null;
  const descricao = descrever(horas, extremos, janelas);
  const idDescricao = `${id}-descricao`;

  return (
    <figure className="space-y-3">
      <p aria-hidden="true" className="text-[0.8125rem] text-mares-suave">
        Altura (m)
      </p>
      {/* Região rolável focável pelo teclado em telas estreitas (WCAG 2.1.1). */}
      <div className="overflow-x-auto" role="region" aria-label="Gráfico da maré, role para os lados" tabIndex={0}>
        <div className="h-80 min-w-[36rem]" role="img" aria-label="Gráfico da maré do dia" aria-describedby={idDescricao}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={horas}
              margin={{ top: 48, right: 24, left: 0, bottom: 8 }}
              accessibilityLayer={false}
              title="Gráfico da maré do dia"
              desc={descricao}
            >
              {nascer && categorias.has(nascer) && nascer !== primeira && (
                <ReferenceArea x1={primeira} x2={nascer} fill="var(--color-mares-noite)" fillOpacity={1} ifOverflow="hidden" />
              )}
              {por && categorias.has(por) && por !== ultima && (
                <ReferenceArea x1={por} x2={ultima} fill="var(--color-mares-noite)" fillOpacity={1} ifOverflow="hidden" />
              )}
              {janelas.map((j) => {
                const fim = categorias.has(j.fim) ? j.fim : ultima;
                return <ReferenceArea key={j.inicio} x1={j.inicio} x2={fim} fill="var(--color-mares-sol)" fillOpacity={0.45} ifOverflow="hidden" />;
              })}
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-mares-divisoria)" vertical={false} />
              <XAxis
                dataKey="horario"
                ticks={ticksX}
                interval={0}
                tickFormatter={(h: string) => fmt.hora(h)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: COR_EIXO, fontSize: 13 }}
                dy={8}
              />
              <YAxis
                domain={dominio}
                ticks={ticksY}
                tickFormatter={(v: number) => fmt.metros(Math.abs(v) < 0.05 ? 0 : v)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: COR_EIXO, fontSize: 13 }}
                width={64}
              />
              <Area
                type="monotone"
                dataKey="nivelMarM"
                stroke={COR_CURVA}
                strokeWidth={3}
                fill="var(--color-mares-agua)"
                fillOpacity={0.45}
                isAnimationActive={false}
              />
              {agora && categorias.has(agora) && (
                <ReferenceLine
                  x={agora}
                  stroke="var(--color-mares-texto)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  label={{ value: `Agora ${horarioAgora}`, position: "top", fill: COR_TEXTO, fontSize: 13, fontWeight: 700 }}
                />
              )}
              {extremos
                .filter((e) => categorias.has(e.horario))
                .map((extremo) => (
                  <ReferenceDot
                    key={extremo.horario}
                    x={extremo.horario}
                    y={extremo.alturaM}
                    shape={(props: { cx?: number; cy?: number }) => <MarcadorMare cx={props.cx} cy={props.cy} extremo={extremo} />}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p id={idDescricao} className="sr-only">
        {descricao}
      </p>
      {/* Legenda em texto: cor nunca é a única pista (manual p. 7, WCAG 1.4.1). */}
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-[0.8125rem] text-mares-suave">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-[3px] w-5 bg-mares-primaria" />
          Nível do mar
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true">▲ ▽</span>
          Maré alta (cheio) e baixa (vazado)
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3 rounded-sm bg-mares-sol" />
          Melhor horário
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3 rounded-sm border border-mares-divisoria bg-mares-noite" />
          Noite
        </span>
        <span>Altura em relação ao nível médio global do mar, não ao zero das tábuas náuticas.</span>
      </figcaption>
    </figure>
  );
}
