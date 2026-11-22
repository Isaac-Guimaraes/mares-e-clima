/**
 * Gera backend/data/praias-osm.json: praias com nome do litoral brasileiro, extraídas do OpenStreetMap.
 *
 * Por que um arquivo e não uma consulta ao vivo: as instâncias públicas da Overpass API levaram de 30 a 40 s
 * por consulta (ou deram timeout) nos testes de 21/11/2026, lento demais para um mapa interativo.
 * Rodar de novo para atualizar:  npm run praias:atualizar --workspace=backend
 *
 * [API PÚBLICA] OpenStreetMap — Overpass API (usada só por este script, não pelo app em execução)
 *   GET https://overpass-api.de/api/interpreter?data=<consulta Overpass QL>
 *   Consulta por estado: area["ISO3166-2"="BR-BA"]->.a; nwr["natural"="beach"]["name"](area.a); out center tags;
 *   Documentação: https://wiki.openstreetmap.org/wiki/Overpass_API
 *   Licença dos dados: ODbL — exige a atribuição "© OpenStreetMap contributors".
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ESTADOS_LITORANEOS: Record<string, string> = {
  AP: 'Amapá', PA: 'Pará', MA: 'Maranhão', PI: 'Piauí', CE: 'Ceará', RN: 'Rio Grande do Norte',
  PB: 'Paraíba', PE: 'Pernambuco', AL: 'Alagoas', SE: 'Sergipe', BA: 'Bahia', ES: 'Espírito Santo',
  RJ: 'Rio de Janeiro', SP: 'São Paulo', PR: 'Paraná', SC: 'Santa Catarina', RS: 'Rio Grande do Sul',
};

const URL_OVERPASS = 'https://overpass-api.de/api/interpreter';
// Nomes genéricos não ajudam a escolher uma praia.
const NOMES_GENERICOS = new Set(['praia', 'beach', 'prainha', 'areia', 'praia sem nome']);

interface ElementoOverpass {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface PraiaOsm {
  id: number;
  nome: string;
  municipio?: string;
  estado: string;
  latitude: number;
  longitude: number;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TIPO = { node: 0, way: 1, relation: 2 } as const;

async function consultarEstado(uf: string): Promise<ElementoOverpass[]> {
  const consulta = `[out:json][timeout:300];area["ISO3166-2"="BR-${uf}"]->.a;nwr["natural"="beach"]["name"](area.a);out center tags;`;
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const resposta = await fetch(`${URL_OVERPASS}?data=${encodeURIComponent(consulta)}`, {
        headers: { 'User-Agent': 'mares-e-clima/0.1 (projeto academico)', Accept: 'application/json' },
        signal: AbortSignal.timeout(360_000),
      });
      if (resposta.ok) return ((await resposta.json()) as { elements: ElementoOverpass[] }).elements;
      console.warn(`  ${uf}: HTTP ${resposta.status}, tentativa ${tentativa}`);
    } catch (erro) {
      console.warn(`  ${uf}: ${String(erro).slice(0, 80)}, tentativa ${tentativa}`);
    }
    await esperar(15_000 * tentativa); // respeita o servidor público entre tentativas
  }
  throw new Error(`Não foi possível consultar ${uf}.`);
}

async function main(): Promise<void> {
  const praias: PraiaOsm[] = [];
  const vistos = new Set<string>();

  for (const [uf, estado] of Object.entries(ESTADOS_LITORANEOS)) {
    const inicio = Date.now();
    const elementos = await consultarEstado(uf);
    let novos = 0;
    for (const e of elementos) {
      const nome = e.tags?.name?.trim();
      const latitude = e.lat ?? e.center?.lat;
      const longitude = e.lon ?? e.center?.lon;
      if (!nome || latitude === undefined || longitude === undefined) continue;
      if (NOMES_GENERICOS.has(nome.toLocaleLowerCase('pt-BR'))) continue;
      // Uma praia longa costuma estar em vários trechos com o mesmo nome: guarda um por ~1 km.
      const chave = `${nome.toLocaleLowerCase('pt-BR')}|${latitude.toFixed(2)}|${longitude.toFixed(2)}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      const municipio = e.tags?.['addr:city'] ?? e.tags?.['is_in:city'];
      praias.push({
        // Negativo e com o tipo embutido: nunca colide com os ids positivos do GeoNames (Geocoding API).
        id: -(e.id * 3 + TIPO[e.type]),
        nome,
        ...(municipio ? { municipio } : {}),
        estado,
        latitude: Number(latitude.toFixed(5)),
        longitude: Number(longitude.toFixed(5)),
      });
      novos++;
    }
    console.log(`${uf}: ${novos} praias (${Math.round((Date.now() - inicio) / 1000)} s)`);
    await esperar(5_000);
  }

  const destino = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'praias-osm.json');
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(
    destino,
    JSON.stringify({
      geradoEm: new Date().toISOString().slice(0, 10),
      fonte: 'OpenStreetMap (natural=beach com nome), via Overpass API',
      licenca: '© OpenStreetMap contributors, ODbL 1.0',
      praias,
    }),
  );
  console.log(`Total: ${praias.length} praias em ${destino}`);
}

void main();
