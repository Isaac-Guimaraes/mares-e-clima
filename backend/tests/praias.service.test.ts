import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PraiaOsm } from '../src/models/praia.model.js';
import { distanciaKm, nucleoDoNome, PraiasService, pontuarNome } from '../src/services/praias.service.js';

const PRAIAS: PraiaOsm[] = [
  { id: -1, nome: 'Praia do Buracão', estado: 'Bahia', latitude: -13.015, longitude: -38.483 },
  { id: -2, nome: 'Praia de Piatã', estado: 'Bahia', latitude: -12.95, longitude: -38.39 },
  { id: -3, nome: 'Praia de Itapuã', estado: 'Bahia', latitude: -12.957, longitude: -38.36 },
  { id: -4, nome: 'Praia do Rio Tapajós', estado: 'Pará', latitude: -2.45, longitude: -54.7 }, // rio: sem maré
  { id: -5, nome: 'Buracão Norte', estado: 'Bahia', latitude: -13.0, longitude: -38.48 },
];

/** Marine falsa: só tem maré quem está no litoral da Bahia (longitude > -40). Conta as chamadas. */
function montar() {
  const consultados: number[] = [];
  const marine = {
    filtrarComMare: async <T extends { latitude: number; longitude: number }>(locais: T[]) => {
      consultados.push(locais.length);
      return locais.filter((l) => l.longitude > -40);
    },
  };
  return { servico: new PraiasService(PRAIAS, marine), consultados };
}

describe('nomes de praia', () => {
  it('ignora acento, maiúsculas e o prefixo "Praia de/do/da"', () => {
    assert.equal(nucleoDoNome('Praia do Buracão'), 'buracao');
    assert.equal(nucleoDoNome('Prainha da Fonte'), 'fonte');
  });

  it('pontua igual, começa com e contém', () => {
    assert.equal(pontuarNome('Praia de Piatã', 'piata'), 0);
    assert.equal(pontuarNome('Buracão Norte', 'buracao'), 1);
    assert.equal(pontuarNome('Praia do Rio Tapajós', 'tapajos'), 2);
    assert.equal(pontuarNome('Praia de Piatã', 'pipa'), null);
  });

  it('calcula distância em km', () => {
    assert.ok(Math.abs(distanciaKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 }) - 111.2) < 0.5);
  });
});

describe('PraiasService', () => {
  it('busca por nome com a praia exata primeiro', async () => {
    const { servico } = montar();
    const nomes = (await servico.buscarPorNome('Praia do Buracão', 8)).map((l) => l.nome);
    assert.deepEqual(nomes, ['Praia do Buracão', 'Buracão Norte']);
  });

  it('descarta praias de rio (sem maré)', async () => {
    const { servico } = montar();
    assert.deepEqual(await servico.buscarPorNome('Tapajós', 8), []);
  });

  it('lista as praias da área, das mais próximas para as mais distantes', async () => {
    const { servico } = montar();
    const area = { sul: -13.1, oeste: -38.6, norte: -12.9, leste: -38.3 };
    const nomes = (await servico.buscarNaArea(area, 10, { latitude: -12.957, longitude: -38.36 })).map((l) => l.nome);
    assert.deepEqual(nomes, ['Praia de Itapuã', 'Praia de Piatã', 'Buracão Norte', 'Praia do Buracão']);
  });

  it('consulta a Marine API só uma vez por praia', async () => {
    const { servico, consultados } = montar();
    const area = { sul: -13.1, oeste: -38.6, norte: -12.9, leste: -38.3 };
    await servico.buscarNaArea(area, 10);
    await servico.buscarNaArea(area, 10);
    await servico.buscarPorNome('Piatã', 8);
    assert.deepEqual(consultados, [4]);
  });

  it('devolve localidades com fuso automático e país', async () => {
    const { servico } = montar();
    const [itapua] = await servico.buscarPorNome('Itapuã', 1);
    assert.equal(itapua?.fusoHorario, 'auto');
    assert.equal(itapua?.pais, 'Brasil');
    assert.ok((itapua?.id ?? 0) < 0);
  });
});
