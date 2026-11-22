import type { Coordenada, LimitesMapa } from "@/src/lib/tipos";

/** O back-end só lista praias em áreas de até 3° de lado; mais que isso, o mapa pede para aproximar. */
export const MAIOR_LADO_GRAUS = 3;

/** Distância em km (haversine), igual à do back-end. */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const kmFormato = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function formatarDistancia(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${kmFormato.format(km)} km`;
}

/**
 * Arredonda a área para fora numa grade de 0,05°: pequenos movimentos do mapa geram a mesma consulta,
 * o que evita requisições repetidas (RNF01).
 */
export function arredondarLimites(l: LimitesMapa): LimitesMapa {
  const passo = 0.05;
  const baixo = (v: number) => Number((Math.floor(v / passo) * passo).toFixed(2));
  const alto = (v: number) => Number((Math.ceil(v / passo) * passo).toFixed(2));
  return { sul: baixo(l.sul), oeste: baixo(l.oeste), norte: alto(l.norte), leste: alto(l.leste) };
}

export function areaPequena(l: LimitesMapa): boolean {
  return l.norte - l.sul <= MAIOR_LADO_GRAUS && l.leste - l.oeste <= MAIOR_LADO_GRAUS;
}
