import type { BuscarJson } from '../clients/open-meteo.client.js';
import type { Localidade } from '../models/localidade.model.js';
import type { CacheMemoria } from '../utils/cache.js';
import type { MarineService } from './marine.service.js';
import { distanciaKm, nucleoDoNome, type PraiasService } from './praias.service.js';

/** Formato bruto da resposta da Geocoding API (apenas os campos usados). */
interface RespostaGeocoding {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    country?: string;
    admin1?: string;
    admin2?: string;
  }>;
}

// A API ordena por população: é preciso pedir bem mais do que o exibido para sobrarem praias após o filtro.
const CANDIDATOS_POR_BUSCA = 40;

// A base registra "Ipanema" e "Pipa", não "Praia de Ipanema" nem "Praia da Pipa".
const PREFIXO_PRAIA = /^praias?\s+(?:d[aeo]s?\s+)?(.+)$/i;

/**
 * RF01 — Busca pelo nome, devolvendo apenas locais do litoral.
 * Junta duas fontes: as praias do OpenStreetMap (nomes de praia de verdade, "Praia do Buracão")
 * e as localidades do GeoNames via Geocoding API (cidades e bairros, "Itapuã"). Praias vêm primeiro.
 */
export class GeocodingService {
  constructor(
    private readonly buscarJson: BuscarJson,
    private readonly urlBase: string,
    private readonly cache: CacheMemoria<Localidade[]>,
    private readonly paisPadrao: string,
    private readonly marine: Pick<MarineService, 'filtrarComMare'>,
    private readonly praiasOsm: Pick<PraiasService, 'buscarPorNome'>,
  ) {}

  async buscar(nome: string, quantidade = 8): Promise<Localidade[]> {
    const chave = `${this.paisPadrao}|${quantidade}|${nome.toLocaleLowerCase('pt-BR')}`;

    return this.cache.obterOuProduzir(chave, async () => {
      const [praias, localidades] = await Promise.all([this.praiasOsm.buscarPorNome(nome, quantidade), this.buscarLocalidades(nome)]);
      // Um bairro "Ipanema" a poucos km da "Praia de Ipanema" seria a mesma escolha duas vezes.
      const novas = localidades.filter(
        (l) => !praias.some((p) => nucleoDoNome(p.nome) === nucleoDoNome(l.nome) && distanciaKm(p, l) < 5),
      );
      return [...praias, ...novas].slice(0, quantidade);
    });
  }

  private async buscarLocalidades(nome: string): Promise<Localidade[]> {
    const encontradas = await this.buscarNoLitoral(nome);
    if (encontradas.length > 0) return encontradas;
    const semPrefixo = PREFIXO_PRAIA.exec(nome)?.[1];
    return semPrefixo ? this.buscarNoLitoral(semPrefixo) : [];
  }

  private async buscarNoLitoral(nome: string): Promise<Localidade[]> {
    /*
     * [API PÚBLICA] Open-Meteo — Geocoding API (RF01)
     *   GET https://geocoding-api.open-meteo.com/v1/search
     *   Exemplo: https://geocoding-api.open-meteo.com/v1/search?name=Itapu%C3%A3&count=40&language=pt&format=json&countryCode=BR
     *   Documentação: https://open-meteo.com/en/docs/geocoding-api
     *   Em seguida, os candidatos passam pela Marine API (MarineService.filtrarComMare).
     */
    const resposta = await this.buscarJson<RespostaGeocoding>(this.urlBase, {
      name: nome,
      count: CANDIDATOS_POR_BUSCA,
      language: 'pt',
      format: 'json',
      countryCode: this.paisPadrao || undefined,
    });

    const candidatas = (resposta.results ?? []).map(
      (r): Localidade => ({
        id: r.id,
        nome: r.name,
        ...(r.admin2 ? { municipio: r.admin2 } : {}),
        ...(r.admin1 ? { estado: r.admin1 } : {}),
        pais: r.country ?? '',
        latitude: r.latitude,
        longitude: r.longitude,
        fusoHorario: r.timezone ?? 'auto',
      }),
    );

    return this.marine.filtrarComMare(candidatas);
  }
}
