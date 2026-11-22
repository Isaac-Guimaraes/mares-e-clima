/**
 * Localidade (praia, bairro ou município) retornada pela busca por nome.
 * Origem: Open-Meteo Geocoding API.
 */
export interface Localidade {
  id: number;
  nome: string;
  /** Município (admin2), quando informado pela API. */
  municipio?: string;
  /** Estado ou província (admin1). */
  estado?: string;
  pais: string;
  latitude: number;
  longitude: number;
  /** Fuso horário IANA da localidade, por exemplo "America/Bahia". */
  fusoHorario: string;
}
