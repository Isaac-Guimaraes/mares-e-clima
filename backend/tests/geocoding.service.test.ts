import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { BuscarJson, Parametros } from '../src/clients/open-meteo.client.js';
import type { Localidade } from '../src/models/localidade.model.js';
import { GeocodingService } from '../src/services/geocoding.service.js';
import { MarineService } from '../src/services/marine.service.js';
import { CacheMemoria } from '../src/utils/cache.js';

const GEOCODING = 'https://geocoding.teste';
const MARINE = 'https://marine.teste';

interface Local {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

/** Base falsa: cada nome devolve locais; a latitude negativa representa o litoral. */
function montar(base: Record<string, Local[]>) {
  const nomesConsultados: string[] = [];
  const buscarJson = (async (urlBase: string, parametros: Parametros) => {
    if (urlBase === GEOCODING) {
      nomesConsultados.push(String(parametros.name));
      return { results: base[String(parametros.name)] };
    }
    const latitudes = parametros.latitude as string[];
    const respostas = latitudes.map((lat) => ({ hourly: { sea_level_height_msl: Number(lat) < 0 ? [null, 0.4] : [null, null] } }));
    return respostas.length === 1 ? respostas[0] : respostas;
  }) as BuscarJson;

  const servico = new GeocodingService(buscarJson, GEOCODING, new CacheMemoria<Localidade[]>(60_000), 'BR', new MarineService(buscarJson, MARINE), {
    buscarPorNome: async () => praiasOsm,
  });
  return { servico, nomesConsultados };
}

let praiasOsm: Localidade[] = [];

const litoral = { id: 1, name: 'Copacabana', latitude: -22.9, longitude: -43.1 };
const interior = { id: 2, name: 'Copacabana', latitude: 16.1, longitude: -57 };

describe('GeocodingService.buscar', () => {
  it('descarta locais sem dados de maré', async () => {
    const { servico } = montar({ Copacabana: [interior, litoral] });
    assert.deepEqual((await servico.buscar('Copacabana')).map((l) => l.id), [1]);
  });

  it('funciona com um único candidato', async () => {
    const { servico } = montar({ Copacabana: [litoral] });
    assert.equal((await servico.buscar('Copacabana')).length, 1);
  });

  it('tenta sem "Praia de" quando o nome completo não existe', async () => {
    const { servico, nomesConsultados } = montar({ Ipanema: [{ ...litoral, name: 'Ipanema' }] });
    const resultado = await servico.buscar('Praia de Ipanema');
    assert.deepEqual(nomesConsultados, ['Praia de Ipanema', 'Ipanema']);
    assert.equal(resultado[0]?.nome, 'Ipanema');
  });

  it('não remove o prefixo quando o nome completo já existe', async () => {
    const { servico, nomesConsultados } = montar({ 'Praia Grande': [{ ...litoral, name: 'Praia Grande' }] });
    await servico.buscar('Praia Grande');
    assert.deepEqual(nomesConsultados, ['Praia Grande']);
  });

  it('respeita a quantidade pedida', async () => {
    const { servico } = montar({ Ita: [litoral, { ...litoral, id: 3 }, { ...litoral, id: 4 }] });
    assert.equal((await servico.buscar('Ita', 2)).length, 2);
  });

  it('põe as praias do OpenStreetMap antes e não repete o bairro homônimo vizinho', async () => {
    praiasOsm = [{ id: -9, nome: 'Praia de Copacabana', estado: 'Rio de Janeiro', pais: 'Brasil', latitude: -22.97, longitude: -43.18, fusoHorario: 'auto' }];
    const bairroVizinho = { ...litoral, latitude: -22.965, longitude: -43.175 }; // ~1 km da praia
    const { servico } = montar({ Copacabana: [bairroVizinho, { ...litoral, id: 7, latitude: -20, longitude: -40 }] });
    const ids = (await servico.buscar('Copacabana')).map((l) => l.id);
    praiasOsm = [];
    assert.deepEqual(ids, [-9, 7]);
  });

  it('devolve lista vazia quando não há resultados', async () => {
    const { servico } = montar({});
    assert.deepEqual(await servico.buscar('Xyz'), []);
  });
});
