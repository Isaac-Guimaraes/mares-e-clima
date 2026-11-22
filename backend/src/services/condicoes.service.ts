import type { PrevisaoTempo } from '../models/clima.model.js';
import type { Condicoes, CriteriosRecomendacao, HoraCondicao } from '../models/condicoes.model.js';
import type { PrevisaoMarinha } from '../models/mare.model.js';
import type { CacheMemoria } from '../utils/cache.js';
import type { ForecastService } from './forecast.service.js';
import type { MarineService } from './marine.service.js';
import type { MaresService } from './mares.service.js';
import type { RecomendacaoService } from './recomendacao.service.js';

export interface ConsultaCondicoes {
  latitude: number;
  longitude: number;
  dias: number;
  fusoHorario: string;
  criterios: CriteriosRecomendacao;
}

export interface DadosBrutos {
  marinha: PrevisaoMarinha;
  tempo: PrevisaoTempo;
}

const AVISO_NAVEGACAO =
  'Os dados de maré vêm de um modelo numérico com resolução de cerca de 8 km e têm precisão limitada perto da costa. ' +
  'Não use para navegação; consulte as Tábuas de Marés da Marinha do Brasil.';

const ATRIBUICAO = 'Dados meteorológicos e marinhos: Open-Meteo.com (CC BY 4.0) e serviços meteorológicos nacionais parceiros.';

/**
 * RF07 — Orquestra as APIs Marine e Forecast e monta a linha do tempo integrada.
 * As duas consultas usam o mesmo fuso e o mesmo número de dias, então os horários
 * coincidem; mesmo assim a junção é feita pelo horário, e não pelo índice.
 */
export class CondicoesService {
  constructor(
    private readonly marineService: MarineService,
    private readonly forecastService: ForecastService,
    private readonly maresService: MaresService,
    private readonly recomendacaoService: RecomendacaoService,
    private readonly cache: CacheMemoria<DadosBrutos>,
  ) {}

  async obter(consulta: ConsultaCondicoes): Promise<Condicoes> {
    const { latitude, longitude, dias, fusoHorario, criterios } = consulta;

    // O cache guarda só os dados das APIs; a recomendação é recalculada a cada consulta (critérios mudam).
    const chave = `${latitude.toFixed(3)}|${longitude.toFixed(3)}|${dias}|${fusoHorario}`;
    const { marinha, tempo } = await this.cache.obterOuProduzir(chave, async () => {
      const [marinhaApi, tempoApi] = await Promise.all([
        this.marineService.obterPrevisao(latitude, longitude, dias, fusoHorario),
        this.forecastService.obterPrevisao(latitude, longitude, dias, fusoHorario),
      ]);
      return { marinha: marinhaApi, tempo: tempoApi };
    });

    return this.montar(consulta, marinha, tempo);
  }

  /** Público para facilitar testes sem rede. */
  montar(consulta: ConsultaCondicoes, marinha: PrevisaoMarinha, tempo: PrevisaoTempo): Condicoes {
    const marinhaPorHorario = new Map(marinha.horas.map((h) => [h.horario, h]));
    const diaPorData = new Map(tempo.dias.map((d) => [d.data, d]));

    const pontosNivel = tempo.horas.map((h) => ({
      horario: h.horario,
      alturaM: marinhaPorHorario.get(h.horario)?.nivelMarM ?? null,
    }));
    const tendencias = this.maresService.calcularTendencias(pontosNivel);
    const mediaDia = this.maresService.mediaPorDia(pontosNivel);

    const horas: HoraCondicao[] = tempo.horas.map((clima, i) => {
      const mar = marinhaPorHorario.get(clima.horario);
      const data = clima.horario.slice(0, 10);
      const dia = diaPorData.get(data);
      const nivelMarM = mar?.nivelMarM ?? null;

      const avaliacao = this.recomendacaoService.avaliarHora(
        { horario: clima.horario, probabilidadeChuva: clima.probabilidadeChuva, ventoKmh: clima.ventoKmh, nivelMarM },
        { nascerDoSol: dia?.nascerDoSol ?? null, porDoSol: dia?.porDoSol ?? null, nivelMedioM: mediaDia.get(data) ?? null },
        consulta.criterios,
      );

      return {
        ...clima,
        nivelMarM,
        alturaOndaM: mar?.alturaOndaM ?? null,
        direcaoOndaGraus: mar?.direcaoOndaGraus ?? null,
        periodoOndaS: mar?.periodoOndaS ?? null,
        temperaturaAguaC: mar?.temperaturaAguaC ?? null,
        tendenciaMare: tendencias[i] ?? null,
        ...avaliacao,
      };
    });

    const avisos = [AVISO_NAVEGACAO];
    if (pontosNivel.every((p) => p.alturaM === null)) {
      avisos.push(
        'Não há dados de maré para este ponto. Tente uma praia vizinha ou um ponto um pouco mais afastado da costa.',
      );
    }

    return {
      localizacao: {
        latitude: consulta.latitude,
        longitude: consulta.longitude,
        latitudeMarinha: marinha.latitude,
        longitudeMarinha: marinha.longitude,
        fusoHorario: tempo.fusoHorario,
      },
      geradoEm: new Date().toISOString(),
      criterios: consulta.criterios,
      horas,
      dias: tempo.dias,
      extremosMare: this.maresService.detectarExtremos(pontosNivel),
      periodosFavoraveis: this.recomendacaoService.agruparPeriodos(horas),
      avisos,
      atribuicao: ATRIBUICAO,
    };
  }
}
