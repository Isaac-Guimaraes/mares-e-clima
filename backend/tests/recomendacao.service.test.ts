import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CRITERIOS_PADRAO } from '../src/models/condicoes.model.js';
import { RecomendacaoService, somarUmaHora } from '../src/services/recomendacao.service.js';

const servico = new RecomendacaoService();
const dia = { nascerDoSol: '2026-11-09T05:00', porDoSol: '2026-11-09T17:40', nivelMedioM: 0 };
const horaBoa = { horario: '2026-11-09T10:00', probabilidadeChuva: 10, ventoKmh: 12, nivelMarM: 0.3 };

describe('RecomendacaoService.avaliarHora', () => {
  it('aprova hora diurna, sem chuva e com vento fraco', () => {
    const r = servico.avaliarHora(horaBoa, dia, { ...CRITERIOS_PADRAO });
    assert.equal(r.favoravel, true);
    assert.equal(r.periodoDiurno, true);
    assert.deepEqual(r.motivos, []);
  });

  it('reprova à noite', () => {
    const r = servico.avaliarHora({ ...horaBoa, horario: '2026-11-09T20:00' }, dia, { ...CRITERIOS_PADRAO });
    assert.equal(r.favoravel, false);
    assert.ok(r.motivos.includes('Fora do período de luz do dia'));
  });

  it('reprova com chuva e vento acima do limite e explica os motivos', () => {
    const r = servico.avaliarHora({ ...horaBoa, probabilidadeChuva: 70, ventoKmh: 31.6 }, dia, { ...CRITERIOS_PADRAO });
    assert.deepEqual(r.motivos, ['Chance de chuva de 70%', 'Vento de 32 km/h']);
  });

  it('respeita a preferência de maré baixa', () => {
    const r = servico.avaliarHora(horaBoa, dia, { ...CRITERIOS_PADRAO, preferenciaMare: 'baixa' });
    assert.deepEqual(r.motivos, ['Maré acima da média do dia']);
  });

  it('não recomenda quando faltam dados', () => {
    const r = servico.avaliarHora({ ...horaBoa, probabilidadeChuva: null }, dia, { ...CRITERIOS_PADRAO });
    assert.equal(r.favoravel, false);
  });
});

describe('RecomendacaoService.agruparPeriodos', () => {
  it('agrupa horas favoráveis consecutivas', () => {
    const horas = [
      { horario: '2026-11-09T08:00', favoravel: true },
      { horario: '2026-11-09T09:00', favoravel: true },
      { horario: '2026-11-09T10:00', favoravel: false },
      { horario: '2026-11-09T11:00', favoravel: true },
    ];
    assert.deepEqual(servico.agruparPeriodos(horas), [
      { inicio: '2026-11-09T08:00', fim: '2026-11-09T10:00' },
      { inicio: '2026-11-09T11:00', fim: '2026-11-09T12:00' },
    ]);
  });
});

describe('somarUmaHora', () => {
  it('vira o dia corretamente', () => {
    assert.equal(somarUmaHora('2026-11-09T23:00'), '2026-11-10T00:00');
  });
});
