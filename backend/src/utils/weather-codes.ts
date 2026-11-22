/**
 * Tradução dos códigos WMO (weather_code) do Open-Meteo para português (RF06).
 * Tabela oficial: https://open-meteo.com/en/docs (seção "WMO Weather interpretation codes").
 */
const DESCRICOES: Readonly<Record<number, string>> = {
  0: 'Céu limpo',
  1: 'Predominantemente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina com geada',
  51: 'Garoa fraca',
  53: 'Garoa moderada',
  55: 'Garoa intensa',
  56: 'Garoa congelante fraca',
  57: 'Garoa congelante intensa',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  66: 'Chuva congelante fraca',
  67: 'Chuva congelante forte',
  71: 'Neve fraca',
  73: 'Neve moderada',
  75: 'Neve forte',
  77: 'Grãos de neve',
  80: 'Pancadas de chuva fracas',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva violentas',
  85: 'Pancadas de neve fracas',
  86: 'Pancadas de neve fortes',
  95: 'Trovoada',
  96: 'Trovoada com granizo leve',
  97: 'Trovoada forte',
  99: 'Trovoada com granizo forte',
};

export function descreverCodigoTempo(codigo: number | null | undefined): string {
  if (codigo === null || codigo === undefined) return 'Sem informação';
  return DESCRICOES[codigo] ?? `Condição desconhecida (código ${codigo})`;
}
