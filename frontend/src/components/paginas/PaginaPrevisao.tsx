"use client";

import Link from "next/link";
import { Chip } from "@/src/components/Avisos";
import { EstadoPraia } from "@/src/components/EstadoPraia";
import { TabelaRolavel } from "@/src/components/TabelaRolavel";
import { IconeTempo, janelasDoDia } from "@/src/lib/condicoes";
import * as fmt from "@/src/lib/formatacao";
import type { PeriodoFavoravel } from "@/src/lib/tipos";

/** "06h–09h"; uma janela que termina à meia-noite aparece como "24h". */
function faixa(p: PeriodoFavoravel): string {
  const fim = p.fim.slice(0, 10) === p.inicio.slice(0, 10) ? p.fim.slice(11, 13) : "24";
  return `${p.inicio.slice(11, 13)}h–${fim}h`;
}

/** Rota "/previsao" — previsão diária e melhores janelas (RF05 e RF08), como no protótipo. */
export function PaginaPrevisao() {
  return (
    <EstadoPraia titulo="Previsão">
      {({ localidade, condicoes }) => {
        const hoje = fmt.horaAtualNoFuso(condicoes.localizacao.fusoHorario).slice(0, 10);
        return (
          <>
            <div>
              <h1 className="titulo-tela">Previsão de {condicoes.dias.length === 1 ? "1 dia" : `${condicoes.dias.length} dias`}</h1>
              <p className="text-lg text-mares-suave">Condições diárias e melhores janelas em {localidade.nome}</p>
            </div>

            <TabelaRolavel
              id="previsao"
              legenda={`Previsão diária em ${localidade.nome}`}
              legendaOculta
              colunas={["Dia", "Condição", "Máx. / Mín.", "UV máximo", "Nascer / pôr do sol", "Melhor janela"]}
            >
              {condicoes.dias.map((d) => {
                const janelas = janelasDoDia(condicoes.periodosFavoraveis, d.data);
                const ehHoje = d.data === hoje;
                return (
                  <tr key={d.data} className={ehHoje ? "bg-mares-superficie-alta" : undefined}>
                    <th scope="row">
                      <span className={ehHoje ? "text-mares-link" : undefined}>{fmt.rotuloDia(d.data, hoje)}</span>
                      <span className="block text-xs font-normal text-mares-suave">{fmt.dataCurta(d.data)}</span>
                    </th>
                    <td>
                      <span className="flex items-center gap-2">
                        <IconeTempo codigo={d.codigoTempo} className="shrink-0 text-mares-titulo" />
                        {d.descricaoTempo}
                      </span>
                    </td>
                    <td className="font-semibold">
                      {fmt.graus(d.temperaturaMaxC)} / {fmt.graus(d.temperaturaMinC)}
                    </td>
                    <td>{fmt.nivelUv(d.indiceUvMax)}</td>
                    <td>
                      {d.nascerDoSol ? fmt.hora(d.nascerDoSol) : "—"} / {d.porDoSol ? fmt.hora(d.porDoSol) : "—"}
                    </td>
                    <td>
                      {janelas.length > 0 ? (
                        <span className="flex flex-wrap gap-1.5">
                          {janelas.map((j) => (
                            <Chip key={j.inicio} tipo="favoravel">
                              {faixa(j)}
                            </Chip>
                          ))}
                        </span>
                      ) : (
                        <span className="text-mares-suave">sem janela</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </TabelaRolavel>

            {/* Heurísticas 7 e 3: atalho para mudar o período e os critérios. */}
            <p className="dica">
              Quer ver mais dias ou janelas com outros critérios?{" "}
              <Link href="/ajustes" className="link min-h-0">
                Ajuste suas preferências
              </Link>
            </p>
          </>
        );
      }}
    </EstadoPraia>
  );
}
