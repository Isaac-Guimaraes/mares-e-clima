import type { Request, Response } from 'express';
import type { PraiasService } from '../services/praias.service.js';
import { HttpError } from '../utils/http-error.js';
import { lerNumero } from '../utils/validacao.js';

// Acima disso o mapa mostra uma região grande demais para listar praias com proveito.
const MAIOR_LADO_GRAUS = 3;

/**
 * GET /api/praias?sul=-13.05&oeste=-38.55&norte=-12.90&leste=-38.30&lat=-12.97&lon=-38.45&quantidade=60
 * Praias (OpenStreetMap) na área visível do mapa, ordenadas pela distância a lat/lon (opcional).
 */
export class PraiaController {
  constructor(private readonly praiasService: PraiasService) {}

  buscarNaArea = async (req: Request, res: Response): Promise<void> => {
    const q = req.query;
    const limites = {
      sul: lerNumero(q.sul, { nome: 'sul', min: -90, max: 90 }),
      oeste: lerNumero(q.oeste, { nome: 'oeste', min: -180, max: 180 }),
      norte: lerNumero(q.norte, { nome: 'norte', min: -90, max: 90 }),
      leste: lerNumero(q.leste, { nome: 'leste', min: -180, max: 180 }),
    };
    if (limites.norte <= limites.sul || limites.leste <= limites.oeste) {
      throw HttpError.requisicaoInvalida('A área do mapa é inválida.');
    }
    if (limites.norte - limites.sul > MAIOR_LADO_GRAUS || limites.leste - limites.oeste > MAIOR_LADO_GRAUS) {
      throw HttpError.requisicaoInvalida('Aproxime o mapa para ver as praias da região.');
    }
    const quantidade = lerNumero(q.quantidade, { nome: 'quantidade', min: 1, max: 100, padrao: 60, inteiro: true });
    const referencia =
      q.lat !== undefined && q.lon !== undefined
        ? { latitude: lerNumero(q.lat, { nome: 'lat', min: -90, max: 90 }), longitude: lerNumero(q.lon, { nome: 'lon', min: -180, max: 180 }) }
        : undefined;

    const praias = await this.praiasService.buscarNaArea(limites, quantidade, referencia);
    res.json({ praias });
  };
}
