import type { PraiaOsm } from '../models/praia.model.js';

interface ArquivoPraias {
  geradoEm?: string;
  praias?: unknown;
}

function ehPraia(valor: unknown): valor is PraiaOsm {
  if (typeof valor !== 'object' || valor === null) return false;
  const p = valor as Record<string, unknown>;
  return typeof p.id === 'number' && typeof p.nome === 'string' && typeof p.estado === 'string'
    && typeof p.latitude === 'number' && typeof p.longitude === 'number';
}

/**
 * Valida a base local de praias do OpenStreetMap (src/data/praias-osm.json).
 * O arquivo é importado como módulo, então vai junto no build e no deploy.
 */
export function carregarPraiasOsm(arquivo: unknown): PraiaOsm[] {
  const conteudo = (typeof arquivo === 'object' && arquivo !== null ? arquivo : {}) as ArquivoPraias;
  const praias = Array.isArray(conteudo.praias) ? conteudo.praias.filter(ehPraia) : [];
  console.log(`[praias] ${praias.length} praias do OpenStreetMap carregadas (base de ${conteudo.geradoEm ?? 'data desconhecida'}).`);
  return praias;
}
