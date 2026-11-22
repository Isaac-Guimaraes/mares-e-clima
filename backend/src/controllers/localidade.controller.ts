import type { Request, Response } from 'express';
import type { GeocodingService } from '../services/geocoding.service.js';
import { lerNumero, lerTexto } from '../utils/validacao.js';

/**
 * GET /api/localidades?nome=Itapuã&quantidade=8
 * Controller fino: valida a entrada HTTP, chama o service e devolve JSON.
 */
export class LocalidadeController {
  constructor(private readonly geocodingService: GeocodingService) {}

  buscar = async (req: Request, res: Response): Promise<void> => {
    const nome = lerTexto(req.query.nome, 'nome', 2, 100);
    const quantidade = lerNumero(req.query.quantidade, { nome: 'quantidade', min: 1, max: 20, padrao: 8, inteiro: true });

    const resultados = await this.geocodingService.buscar(nome, quantidade);
    res.json({ resultados });
  };
}
