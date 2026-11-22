/**
 * Previsão do tempo. Origem: Open-Meteo Weather Forecast API.
 * Horários no formato local "AAAA-MM-DDTHH:MM" (fuso da localidade).
 */
export interface HoraClima {
  horario: string;
  temperaturaC: number | null;
  sensacaoTermicaC: number | null;
  /** Probabilidade de chuva na hora anterior (%). */
  probabilidadeChuva: number | null;
  /** Chuva acumulada na hora anterior (mm). */
  precipitacaoMm: number | null;
  /** Código WMO da condição do tempo. */
  codigoTempo: number | null;
  descricaoTempo: string;
  ventoKmh: number | null;
  direcaoVentoGraus: number | null;
  indiceUv: number | null;
}

export interface DiaClima {
  /** Data local "AAAA-MM-DD". */
  data: string;
  temperaturaMaxC: number | null;
  temperaturaMinC: number | null;
  indiceUvMax: number | null;
  /** Horário local "AAAA-MM-DDTHH:MM". */
  nascerDoSol: string | null;
  porDoSol: string | null;
  codigoTempo: number | null;
  descricaoTempo: string;
}

export interface PrevisaoTempo {
  latitude: number;
  longitude: number;
  fusoHorario: string;
  horas: HoraClima[];
  dias: DiaClima[];
}
