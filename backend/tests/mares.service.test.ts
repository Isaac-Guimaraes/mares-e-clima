import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MaresService } from '../src/services/mares.service.js';

const servico = new MaresService();

/** Gera pontos horários a partir de uma lista de alturas, começando em 2026-11-09T00:00. */
function serie(alturas: Array<number | null>) {
  return alturas.map((alturaM, i) => ({ horario: `2026-11-09T${String(i).padStart(2, '0')}:00`, alturaM }));
}

describe('MaresService.detectarExtremos', () => {
  it('encontra maré alta e maré baixa em uma onda simples', () => {
    const extremos = servico.detectarExtremos(serie([0.1, 0.5, 0.9, 0.6, 0.2, -0.3, -0.1, 0.4]));
    assert.deepEqual(extremos, [
      { tipo: 'alta', horario: '2026-11-09T02:00', alturaM: 0.9 },
      { tipo: 'baixa', horario: '2026-11-09T05:00', alturaM: -0.3 },
    ]);
  });

  it('reporta o início de um platô como extremo', () => {
    const extremos = servico.detectarExtremos(serie([0.1, 0.8, 0.8, 0.8, 0.2]));
    assert.deepEqual(extremos, [{ tipo: 'alta', horario: '2026-11-09T01:00', alturaM: 0.8 }]);
  });

  it('não confunde degrau de subida com maré alta', () => {
    assert.deepEqual(servico.detectarExtremos(serie([0.1, 0.3, 0.3, 0.5, 0.7])), []);
  });

  it('ignora valores nulos', () => {
    const extremos = servico.detectarExtremos(serie([0.1, null, 0.6, 0.2, null, 0.5]));
    assert.deepEqual(extremos, [
      { tipo: 'alta', horario: '2026-11-09T02:00', alturaM: 0.6 },
      { tipo: 'baixa', horario: '2026-11-09T03:00', alturaM: 0.2 },
    ]);
  });

  it('retorna lista vazia quando não há dados', () => {
    assert.deepEqual(servico.detectarExtremos(serie([null, null, null])), []);
  });
});

describe('MaresService.calcularTendencias', () => {
  it('indica enchendo, vazando e estável', () => {
    assert.deepEqual(servico.calcularTendencias(serie([0.1, 0.4, 0.405, 0.1])), ['enchendo', 'estavel', 'vazando', 'vazando']);
  });

  it('retorna null onde falta dado', () => {
    assert.deepEqual(servico.calcularTendencias(serie([null, 0.2, 0.5])), [null, 'enchendo', 'enchendo']);
  });
});

describe('MaresService.mediaPorDia', () => {
  it('calcula a média por data local', () => {
    const pontos = [
      { horario: '2026-11-09T22:00', alturaM: 0.2 },
      { horario: '2026-11-09T23:00', alturaM: 0.4 },
      { horario: '2026-11-10T00:00', alturaM: 1 },
    ];
    const medias = servico.mediaPorDia(pontos);
    assert.ok(Math.abs((medias.get('2026-11-09') ?? 0) - 0.3) < 1e-9);
    assert.equal(medias.get('2026-11-10'), 1);
  });
});
