/**
 * Praia extraída do OpenStreetMap (natural=beach com nome) pelo script scripts/gerar-praias-osm.ts.
 * O id é negativo para nunca colidir com os ids positivos do GeoNames (Geocoding API).
 */
export interface PraiaOsm {
  id: number;
  nome: string;
  municipio?: string;
  estado: string;
  latitude: number;
  longitude: number;
}

/** Retângulo visível do mapa, em graus. */
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
