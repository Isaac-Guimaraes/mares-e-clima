import type { CriteriosRecomendacao, PeriodoFavoravel } from '../models/condicoes.model.js';

/** Dados de uma hora necessários para avaliá-la. */
export interface EntradaAvaliacao {
  horario: string;
  probabilidadeChuva: number | null;
  ventoKmh: number | null;
  nivelMarM: number | null;
}

/** Contexto do dia: nascer/pôr do sol e nível médio do mar naquela data. */
export interface ContextoDia {
  nascerDoSol: string | null;
  porDoSol: string | null;
  nivelMedioM: number | null;
}

export interface Avaliacao {
  favoravel: boolean;
  periodoDiurno: boolean;
  motivos: string[];
}

/**
 * RF08 — Indica os períodos mais favoráveis à praia (escopo, seção 7.2).
 * Uma hora é favorável quando TODOS os critérios são atendidos:
 *  - período diurno (entre nascer e pôr do sol);
 *  - probabilidade de chuva <= limite;
 *  - vento <= limite;
 *  - nível do mar acima/abaixo da média do dia, se houver preferência de maré.
 * Dados ausentes contam como critério não atendido, para não recomendar no escuro.
 */
export class RecomendacaoService {
  avaliarHora(hora: EntradaAvaliacao, dia: ContextoDia, criterios: CriteriosRecomendacao): Avaliacao {
    const motivos: string[] = [];

    // Strings no formato "AAAA-MM-DDTHH:MM" no mesmo fuso podem ser comparadas diretamente.
    const periodoDiurno =
      dia.nascerDoSol !== null && dia.porDoSol !== null && hora.horario >= dia.nascerDoSol && hora.horario < dia.porDoSol;
    if (!periodoDiurno) motivos.push('Fora do período de luz do dia');

    if (hora.probabilidadeChuva === null) {
      motivos.push('Sem previsão de chuva');
    } else if (hora.probabilidadeChuva > criterios.probabilidadeChuvaMax) {
      motivos.push(`Chance de chuva de ${hora.probabilidadeChuva}%`);
    }

    if (hora.ventoKmh === null) {
      motivos.push('Sem previsão de vento');
    } else if (hora.ventoKmh > criterios.ventoMaxKmh) {
      motivos.push(`Vento de ${Math.round(hora.ventoKmh)} km/h`);
    }

    if (criterios.preferenciaMare !== 'indiferente') {
      if (hora.nivelMarM === null || dia.nivelMedioM === null) {
        motivos.push('Sem dados de maré');
      } else {
        const acima = hora.nivelMarM >= dia.nivelMedioM;
        if (criterios.preferenciaMare === 'alta' && !acima) motivos.push('Maré abaixo da média do dia');
        if (criterios.preferenciaMare === 'baixa' && acima) motivos.push('Maré acima da média do dia');
      }
    }

    return { favoravel: motivos.length === 0, periodoDiurno, motivos };
  }

  /** Agrupa horas favoráveis consecutivas em períodos. O `fim` é a hora seguinte à última favorável. */
  agruparPeriodos(horas: ReadonlyArray<{ horario: string; favoravel: boolean }>): PeriodoFavoravel[] {
    const periodos: PeriodoFavoravel[] = [];
    let atual: PeriodoFavoravel | null = null;
    let ultimoHorario: string | null = null;

    for (const { horario, favoravel } of horas) {
      const consecutiva = ultimoHorario !== null && somarUmaHora(ultimoHorario) === horario;
      if (favoravel && atual && consecutiva) {
        atual.fim = somarUmaHora(horario);
      } else if (favoravel) {
        atual = { inicio: horario, fim: somarUmaHora(horario) };
        periodos.push(atual);
      } else {
        atual = null;
      }
      ultimoHorario = horario;
    }
    return periodos;
  }
}

/**
 * Soma uma hora a um horário local "AAAA-MM-DDTHH:MM".
 * Usa UTC apenas como calculadora para não sofrer efeito do fuso do servidor.
 */
export function somarUmaHora(horario: string): string {
  const data = new Date(`${horario}:00Z`);
  data.setUTCHours(data.getUTCHours() + 1);
  return data.toISOString().slice(0, 16);
}
