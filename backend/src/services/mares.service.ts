import type { ExtremoMare, PontoNivel, TendenciaMare } from '../models/mare.model.js';

/** Variação mínima (m) entre horas consecutivas para considerar a maré em movimento. */
const LIMIAR_ESTAVEL_M = 0.01;

/**
 * RF03 — Lógica de marés sobre a série horária de `sea_level_height_msl`.
 * Funções puras, sem rede.
 */
export class MaresService {
  /**
   * Identifica marés altas (máximos locais) e baixas (mínimos locais).
   * Trata platôs (valores repetidos) reportando o primeiro horário do platô.
   * Pontos nulos são ignorados. A resolução é horária: o horário real do
   * extremo pode variar em até ~30 minutos.
   */
  detectarExtremos(pontos: readonly PontoNivel[]): ExtremoMare[] {
    const validos = pontos.filter((p): p is { horario: string; alturaM: number } => p.alturaM !== null);
    const extremos: ExtremoMare[] = [];

    for (let i = 1; i < validos.length - 1; i++) {
      const anterior = validos[i - 1]!;
      const atual = validos[i]!;
      // Só avalia o início de um platô.
      if (atual.alturaM === anterior.alturaM) continue;

      let k = i + 1;
      while (k < validos.length && validos[k]!.alturaM === atual.alturaM) k++;
      const proximo = validos[k];
      if (!proximo) break;

      if (atual.alturaM > anterior.alturaM && atual.alturaM > proximo.alturaM) {
        extremos.push({ tipo: 'alta', horario: atual.horario, alturaM: atual.alturaM });
      } else if (atual.alturaM < anterior.alturaM && atual.alturaM < proximo.alturaM) {
        extremos.push({ tipo: 'baixa', horario: atual.horario, alturaM: atual.alturaM });
      }
    }
    return extremos;
  }

  /** Indica se a maré está enchendo, vazando ou estável em cada ponto, comparando com a hora seguinte. */
  calcularTendencias(pontos: readonly PontoNivel[]): Array<TendenciaMare | null> {
    return pontos.map((ponto, i) => {
      const atual = ponto.alturaM;
      const seguinte = pontos[i + 1]?.alturaM ?? null;
      const anterior = pontos[i - 1]?.alturaM ?? null;
      const referencia = seguinte ?? anterior;
      if (atual === null || referencia === null) return null;

      const delta = seguinte !== null ? seguinte - atual : atual - referencia;
      if (Math.abs(delta) < LIMIAR_ESTAVEL_M) return 'estavel';
      return delta > 0 ? 'enchendo' : 'vazando';
    });
  }

  /** Média do nível do mar por data local ("AAAA-MM-DD"), usada como referência de maré alta/baixa. */
  mediaPorDia(pontos: readonly PontoNivel[]): Map<string, number> {
    const somas = new Map<string, { soma: number; total: number }>();
    for (const { horario, alturaM } of pontos) {
      if (alturaM === null) continue;
      const data = horario.slice(0, 10);
      const acumulado = somas.get(data) ?? { soma: 0, total: 0 };
      acumulado.soma += alturaM;
      acumulado.total += 1;
      somas.set(data, acumulado);
    }
    return new Map([...somas].map(([data, { soma, total }]) => [data, soma / total]));
  }
}
