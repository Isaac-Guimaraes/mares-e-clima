import { Router } from 'express';
import { criarClienteOpenMeteo } from '../clients/open-meteo.client.js';
import { env } from '../config/env.js';
import { carregarPraiasOsm } from '../clients/praias-osm.client.js';
import basePraias from '../data/praias-osm.json' with { type: 'json' };
import { CondicoesController } from '../controllers/condicoes.controller.js';
import { PraiaController } from '../controllers/praia.controller.js';
import { PraiasService } from '../services/praias.service.js';
import { LocalidadeController } from '../controllers/localidade.controller.js';
import type { Localidade } from '../models/localidade.model.js';
import { CondicoesService, type DadosBrutos } from '../services/condicoes.service.js';
import { ForecastService } from '../services/forecast.service.js';
import { GeocodingService } from '../services/geocoding.service.js';
import { MaresService } from '../services/mares.service.js';
import { MarineService } from '../services/marine.service.js';
import { RecomendacaoService } from '../services/recomendacao.service.js';
import { CacheMemoria } from '../utils/cache.js';

/**
 * Raiz de composição: único lugar que instancia e liga as camadas
 * (client → services → controllers → rotas). Em testes, monte com dublês.
 */
export function criarRotas(): Router {
  const buscarJson = criarClienteOpenMeteo(env.openMeteo.timeoutMs);

  const marineService = new MarineService(buscarJson, env.openMeteo.marineUrl);
  // Base local de praias do OpenStreetMap (src/data/praias-osm.json).
  const praiasService = new PraiasService(carregarPraiasOsm(basePraias), marineService);
  const geocodingService = new GeocodingService(
    buscarJson,
    env.openMeteo.geocodingUrl,
    new CacheMemoria<Localidade[]>(env.cacheTtlMs),
    env.paisPadrao,
    marineService,
    praiasService,
  );
  const condicoesService = new CondicoesService(
    marineService,
    new ForecastService(buscarJson, env.openMeteo.forecastUrl),
    new MaresService(),
    new RecomendacaoService(),
    new CacheMemoria<DadosBrutos>(env.cacheTtlMs),
  );

  const localidadeController = new LocalidadeController(geocodingService);
  const condicoesController = new CondicoesController(condicoesService);
  const praiaController = new PraiaController(praiasService);

  const rotas = Router();
  rotas.get('/saude', (_req, res) => {
    res.json({ status: 'ok' });
  });
  rotas.get('/localidades', localidadeController.buscar);
  rotas.get('/praias', praiaController.buscarNaArea);
  rotas.get('/condicoes', condicoesController.obter);
  return rotas;
}
