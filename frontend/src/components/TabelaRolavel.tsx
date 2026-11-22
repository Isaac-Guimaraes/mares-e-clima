import type { ReactNode } from "react";

interface PropsTabela {
  id: string;
  legenda: string;
  colunas: string[];
  /** Esconde a legenda visualmente quando um título logo acima já diz o mesmo. */
  legendaOculta?: boolean;
  children: ReactNode;
}

/** Região rolável focável pelo teclado, com nome vindo da legenda da tabela (WCAG 2.1.1 e 1.4.10). */
export function TabelaRolavel({ id, legenda, colunas, legendaOculta = false, children }: PropsTabela) {
  const idLegenda = `legenda-${id}`;
  return (
    <div className="tabela-rolavel" role="region" aria-labelledby={idLegenda} tabIndex={0}>
      <table className="tabela">
        <caption id={idLegenda} className={legendaOculta ? "sr-only" : undefined}>
          {legenda}
        </caption>
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna} scope="col">
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
