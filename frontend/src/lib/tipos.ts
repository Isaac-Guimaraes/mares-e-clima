/**
 * Contratos da API do back-end (espelho de backend/src/models).
 * Ao alterar um model no back-end, atualize este arquivo também.
 */

export interface Localidade {
  id: number;
  nome: string;
  municipio?: string;
  estado?: string;
  pais: string;
  latitude: number;
  longitude: number;
  fusoHorario: string;
}

export type TipoMare = "alta" | "baixa";
export type TendenciaMare = "enchendo" | "vazando" | "estavel";
export type PreferenciaMare = "alta" | "baixa" | "indiferente";

export interface ExtremoMare {
  tipo: TipoMare;
  horario: string;
  alturaM: number;
}

export interface CriteriosRecomendacao {
  probabilidadeChuvaMax: number;
  ventoMaxKmh: number;
  preferenciaMare: PreferenciaMare;
}

export interface HoraCondicao {
  horario: string;
  nivelMarM: number | null;
  alturaOndaM: number | null;
  direcaoOndaGraus: number | null;
  periodoOndaS: number | null;
  temperaturaAguaC: number | null;
  temperaturaC: number | null;
  sensacaoTermicaC: number | null;
  probabilidadeChuva: number | null;
  precipitacaoMm: number | null;
  codigoTempo: number | null;
  descricaoTempo: string;
  ventoKmh: number | null;
  direcaoVentoGraus: number | null;
  indiceUv: number | null;
  tendenciaMare: TendenciaMare | null;
  periodoDiurno: boolean;
  favoravel: boolean;
  motivos: string[];
}

export interface DiaClima {
  data: string;
  temperaturaMaxC: number | null;
  temperaturaMinC: number | null;
  indiceUvMax: number | null;
  nascerDoSol: string | null;
  porDoSol: string | null;
  codigoTempo: number | null;
  descricaoTempo: string;
}

export interface PeriodoFavoravel {
  inicio: string;
  fim: string;
}

export interface Condicoes {
  localizacao: {
    latitude: number;
    longitude: number;
    latitudeMarinha: number;
    longitudeMarinha: number;
    fusoHorario: string;
  };
  geradoEm: string;
  criterios: CriteriosRecomendacao;
  horas: HoraCondicao[];
  dias: DiaClima[];
  extremosMare: ExtremoMare[];
  periodosFavoraveis: PeriodoFavoravel[];
  avisos: string[];
  atribuicao: string;
}

/** Retângulo visível do mapa, em graus (espelho de backend/src/models/praia.model.ts). */
export interface LimitesMapa {
  sul: number;
  oeste: number;
  norte: number;
  leste: number;
}

export interface Coordenada {
  latitude: number;
  longitude: number;
}

/** Parâmetros de consulta montados a partir das preferências salvas. */
export interface ConsultaCondicoes {
  localidade: Localidade;
  dias: number;
  criterios: CriteriosRecomendacao;
}
