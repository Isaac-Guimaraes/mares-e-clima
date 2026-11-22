"use client";

import { useState } from "react";
import { Chip } from "@/src/components/Avisos";
import { EstadoPraia } from "@/src/components/EstadoPraia";
import type { PraiaConsultada } from "@/src/components/PraiaProvider";
import { SeletorDia } from "@/src/components/SeletorDia";
import { TabelaRolavel } from "@/src/components/TabelaRolavel";
import { doDia, IconeTempo } from "@/src/lib/condicoes";
import * as fmt from "@/src/lib/formatacao";

function TabelaHoras({ consulta }: { consulta: PraiaConsultada }) {
  const { localidade, condicoes } = consulta;
  const agora = fmt.horaAtualNoFuso(condicoes.localizacao.fusoHorario);
  const hoje = agora.slice(0, 10);
  const dias = condicoes.dias.map((d) => d.data);
  const [dia, setDia] = useState(dias.includes(hoje) ? hoje : (dias[0] ?? hoje));
  const rotulo = fmt.rotuloDia(dia, hoje);

  return (
    <>
      <div>
        <h1 className="titulo-tela">Hora a hora</h1>
        <p className="text-lg text-mares-suave">Condições detalhadas a cada hora em {localidade.nome}, para planejar seu tempo no mar</p>
      </div>

      <SeletorDia id="horas" dias={dias} hoje={hoje} selecionado={dia} aoSelecionar={setDia} rotulo="Dia da previsão" />

      <div id="horas-painel" role="tabpanel" aria-labelledby={`horas-aba-${dia}`}>
        {/* RF07: maré e clima na mesma linha do tempo. */}
        <TabelaRolavel
          id={`horas-${dia}`}
          legenda={`Condições hora a hora: ${rotulo.toLowerCase()}`}
          legendaOculta
          colunas={["Hora", "Tempo", "Temp.", "Chuva", "Vento", "Ondas", "Maré", "Tendência", "Favorável", "Por quê"]}
        >
          {doDia(condicoes.horas, dia).map((h) => {
            const vento = fmt.direcao(h.direcaoVentoGraus);
            const ehAgora = h.horario === agora;
            return (
              <tr key={h.horario} className={ehAgora ? "bg-mares-superficie-alta" : undefined}>
                <th scope="row">
                  {h.horario.slice(11, 13)}h{ehAgora && <span className="ml-2 text-xs font-bold text-mares-link uppercase">agora</span>}
                </th>
                <td>
                  <span className="flex items-center gap-2">
                    <IconeTempo codigo={h.codigoTempo} diurno={h.periodoDiurno} className="shrink-0 text-mares-titulo" />
                    {h.descricaoTempo}
                  </span>
                </td>
                <td>{fmt.graus(h.temperaturaC)}</td>
                <td>{fmt.porcentagem(h.probabilidadeChuva)}</td>
                <td>
                  {fmt.velocidade(h.ventoKmh)} <abbr title={vento.nome}>{vento.sigla}</abbr>
                </td>
                <td>{fmt.metros(h.alturaOndaM)}</td>
                <td className="font-semibold">{fmt.metros(h.nivelMarM, 2)}</td>
                <td>{fmt.tendencia(h.tendenciaMare).toLowerCase()}</td>
                <td>{h.favoravel ? <Chip tipo="favoravel">Sim</Chip> : <Chip tipo="neutro">Não</Chip>}</td>
                {/* Heurística 1: o app explica por que uma hora não serve, em vez de só dizer "Não". */}
                <td className="text-mares-suave">{h.favoravel ? "Atende aos seus critérios" : h.motivos.join("; ")}</td>
              </tr>
            );
          })}
        </TabelaRolavel>
      </div>
    </>
  );
}

/** Rota "/hora-a-hora" — linha do tempo integrada de maré e clima (RF05, RF07, RF08). */
export function PaginaHoraAHora() {
  return (
    <EstadoPraia titulo="Hora a hora">
      {(consulta) => <TabelaHoras key={`${consulta.localidade.id}|${consulta.condicoes.geradoEm}`} consulta={consulta} />}
    </EstadoPraia>
  );
}
