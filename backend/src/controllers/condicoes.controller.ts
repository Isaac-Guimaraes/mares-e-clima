import type { Request, Response } from 'express';
import { CRITERIOS_PADRAO, type PreferenciaMare } from '../models/condicoes.model.js';
import type { CondicoesService } from '../services/condicoes.service.js';
import { lerFusoHorario, lerNumero, lerOpcao } from '../utils/validacao.js';

const PREFERENCIAS: readonly PreferenciaMare[] = ['alta', 'baixa', 'indiferente'];

/**
 * GET /api/condicoes?lat=-12.95&lon=-38.36&dias=3&fuso=America/Bahia&chuvaMax=30&ventoMax=25&mare=indiferente
 * Devolve a linha do tempo integrada de maré e clima, marés alta/baixa e períodos favoráveis.
 */
export class CondicoesController {
  constructor(private readonly condicoesService: CondicoesService) {}

  obter = async (req: Request, res: Response): Promise<void> => {
    const q = req.query;

    const condicoes = await this.condicoesService.obter({
      latitude: lerNumero(q.lat, { nome: 'lat', min: -90, max: 90 }),
      longitude: lerNumero(q.lon, { nome: 'lon', min: -180, max: 180 }),
      // A Marine API aceita até 8 dias; limitamos a 7 para manter a resposta leve.
      dias: lerNumero(q.dias, { nome: 'dias', min: 1, max: 7, padrao: 3, inteiro: true }),
      fusoHorario: lerFusoHorario(q.fuso),
      criterios: {
        probabilidadeChuvaMax: lerNumero(q.chuvaMax, {
          nome: 'chuvaMax',
          min: 0,
          max: 100,
          padrao: CRITERIOS_PADRAO.probabilidadeChuvaMax,
        }),
        ventoMaxKmh: lerNumero(q.ventoMax, { nome: 'ventoMax', min: 0, max: 150, padrao: CRITERIOS_PADRAO.ventoMaxKmh }),
        preferenciaMare: lerOpcao(q.mare, 'mare', PREFERENCIAS, CRITERIOS_PADRAO.preferenciaMare),
      },
    });

    res.json(condicoes);
  };
}
