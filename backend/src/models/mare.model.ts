/**
 * Dados marinhos de uma hora. Origem: Open-Meteo Marine Weather API.
 * Horários no formato local "AAAA-MM-DDTHH:MM" (fuso da localidade).
 * Valores ausentes chegam como null quando o modelo não cobre o ponto.
 */
export interface HoraMarinha {
  horario: string;
  /** sea_level_height_msl: nível do mar em relação ao nível médio global, incluindo maré (m). */
  nivelMarM: number | null;
  /** wave_height: altura significativa das ondas (m). */
  alturaOndaM: number | null;
  /** wave_direction: direção de onde as ondas vêm (graus). */
  direcaoOndaGraus: number | null;
  /** wave_period: período entre ondas (s). */
  periodoOndaS: number | null;
  /** sea_surface_temperature: temperatura da superfície do mar (°C). */
  temperaturaAguaC: number | null;
}

export interface PrevisaoMarinha {
  /** Centro da célula da grade efetivamente usada pelo modelo. */
  latitude: number;
  longitude: number;
  horas: HoraMarinha[];
}

export type TipoMare = 'alta' | 'baixa';

export type TendenciaMare = 'enchendo' | 'vazando' | 'estavel';

/** Ponto de maré alta ou baixa identificado na série horária. */
export interface ExtremoMare {
  tipo: TipoMare;
  horario: string;
  alturaM: number;
}

/** Entrada mínima para a detecção de extremos. */
export interface PontoNivel {
  horario: string;
  alturaM: number | null;
}
