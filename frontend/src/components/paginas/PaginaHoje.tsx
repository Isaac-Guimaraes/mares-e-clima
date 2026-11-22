"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Droplets, Sun, Sunrise, Thermometer, Waves, Wind } from "lucide-react";
import { AvisoInfo, Chip } from "@/src/components/Avisos";
import { EstadoPraia } from "@/src/components/EstadoPraia";
import { GraficoMare } from "@/src/components/GraficoMare";
import { BotaoFavorito, descreverLocal } from "@/src/components/ListaLocais";
import { usePraia, type PraiaConsultada } from "@/src/components/PraiaProvider";
import { SeletorDia } from "@/src/components/SeletorDia";
import { TabelaRolavel } from "@/src/components/TabelaRolavel";
import { doDia, IconeTempo, janelasDoDia, proximoExtremo, resumirJanela, uvMerecemAtencao } from "@/src/lib/condicoes";
import * as fmt from "@/src/lib/formatacao";
import type { Condicoes, HoraCondicao, PeriodoFavoravel } from "@/src/lib/tipos";

function Indicador({ icone, rotulo, valor, detalhe }: { icone: ReactNode; rotulo: string; valor: string; detalhe?: ReactNode }) {
  return (
    <div className="rounded-[1rem] border border-mares-divisoria bg-mares-superficie p-4">
      <dt className="flex items-center gap-2 text-sm text-mares-suave">
        {icone}
        {rotulo}
      </dt>
      <dd className="mt-1 font-titulo text-2xl font-black text-mares-titulo [overflow-wrap:anywhere]">{valor}</dd>
      {detalhe && <dd className="mt-1 text-sm">{detalhe}</dd>}
    </div>
  );
}

function Agora({ h, condicoes }: { h: HoraCondicao; condicoes: Condicoes }) {
  const vento = fmt.direcao(h.direcaoVentoGraus);
  const onda = fmt.direcao(h.direcaoOndaGraus);
  const dia = condicoes.dias.find((d) => h.horario.startsWith(d.data));
  return (
    <section aria-labelledby="titulo-agora" className="space-y-3">
      <h2 id="titulo-agora" className="titulo-secao">
        Agora <span className="font-sans text-base font-normal text-mares-suave">({fmt.hora(h.horario)})</span>
      </h2>
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-3">
        <Indicador icone={<IconeTempo codigo={h.codigoTempo} diurno={h.periodoDiurno} size={18} />} rotulo="Céu" valor={h.descricaoTempo} />
        <Indicador icone={<Thermometer size={18} />} rotulo="Ar" valor={fmt.graus(h.temperaturaC)} detalhe={`Sensação de ${fmt.graus(h.sensacaoTermicaC)}`} />
        <Indicador icone={<Wind size={18} />} rotulo="Vento" valor={fmt.velocidade(h.ventoKmh)} detalhe={`Vindo de ${vento.nome}`} />
        <Indicador icone={<Droplets size={18} />} rotulo="Chuva" valor={fmt.porcentagem(h.probabilidadeChuva)} detalhe="de chance" />
        <Indicador icone={<Waves size={18} />} rotulo="Ondas" valor={fmt.metros(h.alturaOndaM)} detalhe={`${fmt.segundos(h.periodoOndaS)}, de ${onda.nome}`} />
        <Indicador icone={<Thermometer size={18} />} rotulo="Água" valor={fmt.graus(h.temperaturaAguaC)} />
        <Indicador
          icone={<Sun size={18} />}
          rotulo="Índice UV"
          valor={h.indiceUv === null ? "—" : String(Math.round(h.indiceUv))}
          detalhe={uvMerecemAtencao(h.indiceUv) ? <Chip tipo="atencao">{fmt.classeUv(h.indiceUv)}</Chip> : fmt.classeUv(h.indiceUv)}
        />
        <Indicador
          icone={<Sunrise size={18} />}
          rotulo="Nascer do sol"
          valor={dia?.nascerDoSol ? fmt.hora(dia.nascerDoSol) : "—"}
          detalhe={dia?.porDoSol ? `Pôr do sol às ${fmt.hora(dia.porDoSol)}` : undefined}
        />
      </dl>
    </section>
  );
}

function MelhoresHorarios({ janelas, condicoes, rotulo }: { janelas: PeriodoFavoravel[]; condicoes: Condicoes; rotulo: string }) {
  const { probabilidadeChuvaMax, ventoMaxKmh, preferenciaMare } = condicoes.criterios;
  return (
    <section aria-labelledby="titulo-melhores" className="cartao space-y-4 border-l-8 border-l-mares-sol">
      <h2 id="titulo-melhores" className="titulo-secao">
        Melhores horários <span className="font-sans text-base font-normal text-mares-suave">({rotulo.toLowerCase()})</span>
      </h2>
      {janelas.length > 0 ? (
        <ul className="space-y-3">
          {janelas.map((j) => {
            const r = resumirJanela(condicoes.horas, j);
            const detalhes = [
              r.tendencia ? `maré ${fmt.tendencia(r.tendencia).toLowerCase()}` : null,
              r.ondaMaxM !== null ? `ondas até ${fmt.metros(r.ondaMaxM)}` : null,
            ].filter(Boolean);
            return (
              <li key={j.inicio} className="rounded-[0.875rem] bg-mares-superficie-alta px-4 py-3">
                <p className="font-titulo text-2xl font-black text-mares-titulo">
                  {fmt.hora(j.inicio)} às {fmt.hora(j.fim)}
                </p>
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  {detalhes.join(" · ")}
                  {uvMerecemAtencao(r.uvMax) && <Chip tipo="atencao">UV muito alto: use protetor</Chip>}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>Nenhum horário atende aos seus critérios neste dia.</p>
      )}
      {/* Heurística 6 (reconhecer em vez de lembrar): os critérios usados ficam à vista. */}
      <p className="dica">
        Seus critérios: luz do dia, chuva até {probabilidadeChuvaMax}%, vento até {ventoMaxKmh} km/h
        {preferenciaMare === "indiferente" ? "" : `, maré ${preferenciaMare}`}.{" "}
        <Link href="/ajustes" className="link min-h-0">
          Alterar critérios
        </Link>
      </p>
    </section>
  );
}

function MareAgora({ h, condicoes, agora }: { h: HoraCondicao; condicoes: Condicoes; agora: string }) {
  const proximo = proximoExtremo(condicoes.extremosMare, agora);
  const Seta = h.tendenciaMare === "vazando" ? ArrowDown : ArrowUp;
  return (
    <div className="flex items-center gap-4 rounded-[1rem] bg-mares-superficie-alta p-4">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-mares-primaria text-mares-sobre-primaria">
        <Seta size={26} />
      </span>
      <div>
        <p className="font-titulo text-xl font-extrabold text-mares-titulo">
          Maré agora: {fmt.tendencia(h.tendenciaMare)} · {fmt.metros(h.nivelMarM, 2)}
        </p>
        {proximo && (
          <p className="text-mares-suave">
            Próxima: maré {proximo.tipo} {proximo.horario.startsWith(agora.slice(0, 10)) ? "" : `${fmt.rotuloDia(proximo.horario.slice(0, 10), agora.slice(0, 10)).toLowerCase()} `}
            às {fmt.hora(proximo.horario)} ({fmt.metros(proximo.alturaM, 2)})
          </p>
        )}
      </div>
    </div>
  );
}

function ConteudoHoje({ consulta }: { consulta: PraiaConsultada }) {
  const { consumirFocoPainel } = usePraia();
  const titulo = useRef<HTMLHeadingElement>(null);
  const { localidade, condicoes } = consulta;
  const fuso = condicoes.localizacao.fusoHorario;
  const agora = fmt.horaAtualNoFuso(fuso);
  const hoje = agora.slice(0, 10);
  const dias = condicoes.dias.map((d) => d.data);
  const [dia, setDia] = useState(dias.includes(hoje) ? hoje : (dias[0] ?? hoje));

  // Ao chegar da busca, o leitor de tela começa pelo título desta tela (WCAG 2.4.3).
  useEffect(() => {
    if (consumirFocoPainel()) titulo.current?.focus();
  }, [consumirFocoPainel]);

  const niveis = condicoes.horas.flatMap((h) => (h.nivelMarM === null ? [] : [h.nivelMarM]));
  const folga = niveis.length ? Math.max((Math.max(...niveis) - Math.min(...niveis)) * 0.2, 0.1) : 0.5;
  const dominio: [number, number] = niveis.length ? [Math.min(...niveis) - folga, Math.max(...niveis) + folga] : [-1, 1];
  const horasDia = doDia(condicoes.horas, dia);
  const extremosDia = doDia(condicoes.extremosMare, dia);
  const janelas = janelasDoDia(condicoes.periodosFavoraveis, dia);
  const climaDia = condicoes.dias.find((d) => d.data === dia);
  const horaAtual = condicoes.horas.find((h) => h.horario === agora);
  const rotulo = fmt.rotuloDia(dia, hoje);
  const local = descreverLocal(localidade);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 ref={titulo} tabIndex={-1} className="titulo-tela">
            Hoje em {localidade.nome}
          </h1>
          {/* Manual, p. 8 (legenda): de onde vem o dado e quando foi atualizado. */}
          <p className="dica">
            {local && `${local} · `}Atualizado {fmt.tempoDesde(condicoes.geradoEm)} · Fonte: Open-Meteo
          </p>
        </div>
        <BotaoFavorito localidade={localidade} />
      </div>

      {condicoes.avisos.map((aviso) => (
        <AvisoInfo key={aviso}>{aviso}</AvisoInfo>
      ))}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="titulo-mares" className="cartao min-w-0 space-y-4">
          <h2 id="titulo-mares" className="titulo-secao">
            Marés
          </h2>
          <SeletorDia id="hoje" dias={dias} hoje={hoje} selecionado={dia} aoSelecionar={setDia} rotulo="Dia da previsão" />
          <div id="hoje-painel" role="tabpanel" aria-labelledby={`hoje-aba-${dia}`} tabIndex={0} className="space-y-4">
            <GraficoMare
              id={`grafico-${dia}`}
              horas={horasDia}
              extremos={extremosDia}
              janelas={janelas}
              nascerDoSol={climaDia?.nascerDoSol ?? null}
              porDoSol={climaDia?.porDoSol ?? null}
              agora={dia === hoje ? agora : null}
              horarioAgora={fmt.horarioAtualNoFuso(fuso)}
              dominio={dominio}
            />
            {dia === hoje && horaAtual && <MareAgora h={horaAtual} condicoes={condicoes} agora={agora} />}
            {extremosDia.length > 0 && (
              <TabelaRolavel id={`extremos-${dia}`} legenda={`Marés altas e baixas: ${rotulo.toLowerCase()} (resolução de 1 hora)`} colunas={["Horário", "Maré", "Altura"]}>
                {extremosDia.map((e) => (
                  <tr key={e.horario}>
                    <th scope="row">{fmt.hora(e.horario)}</th>
                    <td>
                      <span aria-hidden="true">{e.tipo === "alta" ? "▲ " : "▽ "}</span>
                      {e.tipo === "alta" ? "Alta" : "Baixa"}
                    </td>
                    <td>{fmt.metros(e.alturaM, 2)}</td>
                  </tr>
                ))}
              </TabelaRolavel>
            )}
          </div>
        </section>

        <div className="min-w-0 space-y-6">
          <MelhoresHorarios janelas={janelas} condicoes={condicoes} rotulo={rotulo} />
          {horaAtual && <Agora h={horaAtual} condicoes={condicoes} />}
        </div>
      </div>
    </>
  );
}

/** Rota "/hoje" — painel integrado de maré e clima (RF02 a RF08), como na tela "Hoje" do protótipo. */
export function PaginaHoje() {
  return (
    <EstadoPraia titulo="Hoje">
      {(consulta) => <ConteudoHoje key={`${consulta.localidade.id}|${consulta.condicoes.geradoEm}`} consulta={consulta} />}
    </EstadoPraia>
  );
}
