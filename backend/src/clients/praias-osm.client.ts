import { readFileSync } from 'node:fs';
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
 * Lê a base local de praias do OpenStreetMap (backend/data/praias-osm.json).
 * Sem o arquivo, o app continua funcionando só com a Geocoding API.
 */
export function carregarPraiasOsm(caminho: URL): PraiaOsm[] {
  try {
    const arquivo = JSON.parse(readFileSync(caminho, 'utf8')) as ArquivoPraias;
    const praias = Array.isArray(arquivo.praias) ? arquivo.praias.filter(ehPraia) : [];
    console.log(`[praias] ${praias.length} praias do OpenStreetMap carregadas (base de ${arquivo.geradoEm ?? 'data desconhecida'}).`);
    return praias;
  } catch {
    console.warn('[praias] Base de praias não encontrada em backend/data/praias-osm.json.');
    return [];
  }
}
