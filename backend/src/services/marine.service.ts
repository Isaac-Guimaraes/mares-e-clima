import type { BuscarJson } from '../clients/open-meteo.client.js';
import type { HoraMarinha, PrevisaoMarinha } from '../models/mare.model.js';

export const VARIAVEIS_MARINHAS = [
  'sea_level_height_msl',
  'wave_height',
  'wave_direction',
  'wave_period',
  'sea_surface_temperature',
] as const;

type Serie = Array<number | null>;

interface RespostaMarine {
  latitude: number;
  longitude: number;
  hourly?: { time: string[] } & Partial<Record<(typeof VARIAVEIS_MARINHAS)[number], Serie>>;
}

interface RespostaCobertura {
  hourly?: { sea_level_height_msl?: Serie };
}

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

/**
 * RF02 e RF04 — Nível do mar (maré), ondas e temperatura da água.
 * Endpoint: GET https://marine-api.open-meteo.com/v1/marine
 * Observação: maré calculada por modelo (~8 km); não serve para navegação.
 */
export class MarineService {
  constructor(
    private readonly buscarJson: BuscarJson,
    private readonly urlBase: string,
  ) {}

  async obterPrevisao(latitude: number, longitude: number, dias: number, fusoHorario: string): Promise<PrevisaoMarinha> {
    /*
     * [API PÚBLICA] Open-Meteo — Marine Weather API (RF02, RF03, RF04)
     *   GET https://marine-api.open-meteo.com/v1/marine
     *   Exemplo: https://marine-api.open-meteo.com/v1/marine?latitude=-22.97&longitude=-43.18
     *     &hourly=sea_level_height_msl,wave_height,wave_direction,wave_period,sea_surface_temperature
     *     &timezone=America/Sao_Paulo&forecast_days=3&cell_selection=sea
     *   Documentação: https://open-meteo.com/en/docs/marine-weather-api
     */
    const resposta = await this.buscarJson<RespostaMarine>(this.urlBase, {
      latitude,
      longitude,
      hourly: VARIAVEIS_MARINHAS,
      timezone: fusoHorario,
      forecast_days: dias,
      // Prefere células da grade sobre o mar (padrão da API, explicitado aqui).
      cell_selection: 'sea',
    });

    const h = resposta.hourly;
    const horarios = h?.time ?? [];
    const valor = (serie: Serie | undefined, i: number): number | null => serie?.[i] ?? null;

    const horas = horarios.map(
      (horario, i): HoraMarinha => ({
        horario,
        nivelMarM: valor(h?.sea_level_height_msl, i),
        alturaOndaM: valor(h?.wave_height, i),
        direcaoOndaGraus: valor(h?.wave_direction, i),
        periodoOndaS: valor(h?.wave_period, i),
        temperaturaAguaC: valor(h?.sea_surface_temperature, i),
      }),
    );

    return { latitude: resposta.latitude, longitude: resposta.longitude, horas };
  }

  /**
   * RF01 — Mantém só os locais com dados de maré. No interior a API devolve o nível do mar nulo,
   * o que separa uma praia de uma cidade homônima sem depender de lista própria de praias.
   */
  async filtrarComMare<T extends Coordenadas>(locais: T[]): Promise<T[]> {
    if (locais.length === 0) return [];

    /*
     * [API PÚBLICA] Open-Meteo — Marine Weather API, várias coordenadas numa só chamada (RF01)
     *   GET https://marine-api.open-meteo.com/v1/marine?latitude=-22.97,-16.1&longitude=-43.18,-57.0
     *     &hourly=sea_level_height_msl&forecast_days=1&cell_selection=sea
     *   Resposta: uma lista na mesma ordem das coordenadas; nível do mar nulo = sem maré (interior).
     */
    const resposta = await this.buscarJson<RespostaCobertura | RespostaCobertura[]>(this.urlBase, {
      latitude: locais.map((l) => String(l.latitude)),
      longitude: locais.map((l) => String(l.longitude)),
      hourly: ['sea_level_height_msl'],
      forecast_days: 1,
      cell_selection: 'sea',
    });

    // A API só devolve lista quando recebe mais de uma coordenada.
    const coberturas = Array.isArray(resposta) ? resposta : [resposta];
    return locais.filter((_, i) => coberturas[i]?.hourly?.sea_level_height_msl?.some((nivel) => nivel !== null));
  }
}
