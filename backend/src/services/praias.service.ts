import type { Localidade } from '../models/localidade.model.js';
import type { Coordenada, LimitesMapa, PraiaOsm } from '../models/praia.model.js';
import type { MarineService } from './marine.service.js';

// A Marine API aceita várias coordenadas por chamada; lotes de 50 mantêm a URL curta.
const LOTE_MARINE = 50;

/** "Praia do Buracão" → "buracao": sem acento, minúsculo e sem o prefixo "praia de/do/da". */
export function nucleoDoNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^(praias?|prainha)\s+(d[aeo]s?\s+)?/, '')
    .trim();
}

/** 0 = nome igual, 1 = começa igual, 2 = contém a palavra; null = não combina. */
export function pontuarNome(nome: string, busca: string): number | null {
  const n = nucleoDoNome(nome);
  const b = nucleoDoNome(busca);
  if (!b) return null;
  if (n === b) return 0;
  if (n.startsWith(b)) return 1;
  if (` ${n}`.includes(` ${b}`)) return 2;
  return null;
}

/** Distância em km pela fórmula de haversine. */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function paraLocalidade(p: PraiaOsm): Localidade {
  return {
    id: p.id,
    nome: p.nome,
    ...(p.municipio ? { municipio: p.municipio } : {}),
    estado: p.estado,
    pais: 'Brasil',
    latitude: p.latitude,
    longitude: p.longitude,
    // O OSM não informa fuso; a Forecast API resolve com timezone=auto.
    fusoHorario: 'auto',
  };
}

/**
 * RF01 — Busca de praias por nome, por área do mapa e por proximidade, na base local do OpenStreetMap.
 * Praias de rio ou lagoa são descartadas pela Marine API (sem dados de maré); o resultado de cada
 * praia fica guardado em memória, pois o litoral não muda.
 */
export class PraiasService {
  private readonly temMare = new Map<number, boolean>();

  constructor(
    private readonly praias: PraiaOsm[],
    private readonly marine: Pick<MarineService, 'filtrarComMare'>,
  ) {}

  async buscarPorNome(nome: string, quantidade: number): Promise<Localidade[]> {
    const candidatas = this.praias
      .map((praia) => ({ praia, pontos: pontuarNome(praia.nome, nome) }))
      .filter((c): c is { praia: PraiaOsm; pontos: number } => c.pontos !== null)
      .sort((a, b) => a.pontos - b.pontos || a.praia.nome.localeCompare(b.praia.nome, 'pt-BR'))
      .slice(0, quantidade * 3)
      .map((c) => c.praia);
    return (await this.filtrarLitoral(candidatas)).slice(0, quantidade).map(paraLocalidade);
  }

  /** Praias dentro do retângulo do mapa, das mais próximas da referência (ou do centro) para as mais distantes. */
  async buscarNaArea(limites: LimitesMapa, quantidade: number, referencia?: Coordenada): Promise<Localidade[]> {
    const centro = referencia ?? { latitude: (limites.sul + limites.norte) / 2, longitude: (limites.oeste + limites.leste) / 2 };
    const candidatas = this.praias
      .filter((p) => p.latitude >= limites.sul && p.latitude <= limites.norte && p.longitude >= limites.oeste && p.longitude <= limites.leste)
      .map((praia) => ({ praia, km: distanciaKm(centro, praia) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, quantidade * 2)
      .map((c) => c.praia);
    return (await this.filtrarLitoral(candidatas)).slice(0, quantidade).map(paraLocalidade);
  }

  private async filtrarLitoral(praias: PraiaOsm[]): Promise<PraiaOsm[]> {
    const desconhecidas = praias.filter((p) => !this.temMare.has(p.id));
    for (let i = 0; i < desconhecidas.length; i += LOTE_MARINE) {
      const lote = desconhecidas.slice(i, i + LOTE_MARINE);
      const comMare = new Set((await this.marine.filtrarComMare(lote)).map((p) => p.id));
      for (const p of lote) this.temMare.set(p.id, comMare.has(p.id));
    }
    return praias.filter((p) => this.temMare.get(p.id));
  }
}
