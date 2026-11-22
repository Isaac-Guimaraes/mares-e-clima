import type { DiaClima, HoraClima } from './clima.model.js';
import type { ExtremoMare, HoraMarinha, TendenciaMare } from './mare.model.js';

export type PreferenciaMare = 'alta' | 'baixa' | 'indiferente';

/** Critérios configuráveis pelo usuário (escopo, seção 7.2). */
export interface CriteriosRecomendacao {
  /** Probabilidade de chuva máxima aceita (%). Padrão: 30. */
  probabilidadeChuvaMax: number;
  /** Velocidade máxima do vento aceita (km/h). Padrão: 25. */
  ventoMaxKmh: number;
  preferenciaMare: PreferenciaMare;
}

export const CRITERIOS_PADRAO: Readonly<CriteriosRecomendacao> = Object.freeze({
  probabilidadeChuvaMax: 30,
  ventoMaxKmh: 25,
  preferenciaMare: 'indiferente',
});

/** Uma hora da linha do tempo integrada: mar + tempo + avaliação. */
export interface HoraCondicao extends HoraMarinha, HoraClima {
  tendenciaMare: TendenciaMare | null;
  /** Indica se a hora está entre o nascer e o pôr do sol. */
  periodoDiurno: boolean;
  favoravel: boolean;
  /** Motivos, em português, pelos quais a hora não é favorável. */
  motivos: string[];
}

/** Intervalo contínuo de horas favoráveis. `fim` é exclusivo. */
export interface PeriodoFavoravel {
  inicio: string;
  fim: string;
}

export interface Condicoes {
  localizacao: {
    latitude: number;
    longitude: number;
    /** Ponto efetivo usado pela Marine API (centro da célula no mar). */
    latitudeMarinha: number;
    longitudeMarinha: number;
    fusoHorario: string;
  };
  geradoEm: string;
  criterios: CriteriosRecomendacao;
  horas: HoraCondicao[];
  dias: DiaClima[];
  extremosMare: ExtremoMare[];
  periodosFavoraveis: PeriodoFavoravel[];
  avisos: string[];
  atribuicao: string;
}
