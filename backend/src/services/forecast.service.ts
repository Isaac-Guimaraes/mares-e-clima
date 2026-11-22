import type { BuscarJson } from '../clients/open-meteo.client.js';
import type { DiaClima, HoraClima, PrevisaoTempo } from '../models/clima.model.js';
import { descreverCodigoTempo } from '../utils/weather-codes.js';

export const VARIAVEIS_HORARIAS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'uv_index',
] as const;

export const VARIAVEIS_DIARIAS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'uv_index_max',
  'sunrise',
  'sunset',
] as const;

type Serie<T = number> = Array<T | null>;

interface RespostaForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly?: { time: string[] } & Partial<Record<(typeof VARIAVEIS_HORARIAS)[number], Serie>>;
  daily?: { time: string[] } & Partial<
    Record<Exclude<(typeof VARIAVEIS_DIARIAS)[number], 'sunrise' | 'sunset'>, Serie>
  > & { sunrise?: Serie<string>; sunset?: Serie<string> };
}

/**
 * RF05 — Condições do tempo e previsão horária e diária.
 * Endpoint: GET https://api.open-meteo.com/v1/forecast
 */
export class ForecastService {
  constructor(
    private readonly buscarJson: BuscarJson,
    private readonly urlBase: string,
  ) {}

  async obterPrevisao(latitude: number, longitude: number, dias: number, fusoHorario: string): Promise<PrevisaoTempo> {
    /*
     * [API PÚBLICA] Open-Meteo — Weather Forecast API (RF05, RF06)
     *   GET https://api.open-meteo.com/v1/forecast
     *   Exemplo: https://api.open-meteo.com/v1/forecast?latitude=-22.97&longitude=-43.18
     *     &hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,
     *      wind_speed_10m,wind_direction_10m,uv_index
     *     &daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset
     *     &timezone=America/Sao_Paulo&forecast_days=3
     *   Documentação: https://open-meteo.com/en/docs
     *   Mesmo timezone e forecast_days da Marine API, para os horários coincidirem (RF07).
     */
    const r = await this.buscarJson<RespostaForecast>(this.urlBase, {
      latitude,
      longitude,
      hourly: VARIAVEIS_HORARIAS,
      daily: VARIAVEIS_DIARIAS,
      timezone: fusoHorario,
      forecast_days: dias,
      wind_speed_unit: 'kmh',
      temperature_unit: 'celsius',
    });

    const valor = <T>(serie: Serie<T> | undefined, i: number): T | null => serie?.[i] ?? null;
    const h = r.hourly;
    const d = r.daily;

    const horas = (h?.time ?? []).map((horario, i): HoraClima => {
      const codigo = valor(h?.weather_code, i);
      return {
        horario,
        temperaturaC: valor(h?.temperature_2m, i),
        sensacaoTermicaC: valor(h?.apparent_temperature, i),
        probabilidadeChuva: valor(h?.precipitation_probability, i),
        precipitacaoMm: valor(h?.precipitation, i),
        codigoTempo: codigo,
        descricaoTempo: descreverCodigoTempo(codigo),
        ventoKmh: valor(h?.wind_speed_10m, i),
        direcaoVentoGraus: valor(h?.wind_direction_10m, i),
        indiceUv: valor(h?.uv_index, i),
      };
    });

    const listaDias = (d?.time ?? []).map((data, i): DiaClima => {
      const codigo = valor(d?.weather_code, i);
      return {
        data,
        temperaturaMaxC: valor(d?.temperature_2m_max, i),
        temperaturaMinC: valor(d?.temperature_2m_min, i),
        indiceUvMax: valor(d?.uv_index_max, i),
        nascerDoSol: valor(d?.sunrise, i),
        porDoSol: valor(d?.sunset, i),
        codigoTempo: codigo,
        descricaoTempo: descreverCodigoTempo(codigo),
      };
    });

    return { latitude: r.latitude, longitude: r.longitude, fusoHorario: r.timezone, horas, dias: listaDias };
  }
}
