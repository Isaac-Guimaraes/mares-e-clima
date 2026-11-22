// Carrega o arquivo .env, se existir (Node.js >= 20.12; o projeto exige 22+). Variáveis já definidas no ambiente têm prioridade.
try {
  process.loadEnvFile();
} catch {
  // Sem .env: seguem os valores padrão abaixo.
}

function numero(nome: string, padrao: number): number {
  const bruto = process.env[nome];
  if (bruto === undefined || bruto === '') return padrao;
  const valor = Number(bruto);
  if (!Number.isFinite(valor)) {
    throw new Error(`Variável de ambiente ${nome} inválida: "${bruto}" não é um número.`);
  }
  return valor;
}

export const env = Object.freeze({
  porta: numero('PORT', 3333),
  // Sem CORS_ORIGIN, aceita qualquer origem: a API só tem rotas GET com dados públicos.
  corsOrigin: process.env.CORS_ORIGIN?.trim() || true,
  cacheTtlMs: Math.max(numero('CACHE_TTL_MINUTOS', 60), 1) * 60_000,
  paisPadrao: (process.env.PAIS_PADRAO ?? 'BR').trim().toUpperCase(),
  // [API PÚBLICA] Endereços das três APIs públicas do Open-Meteo (sem chave, uso não comercial).
  openMeteo: Object.freeze({
    geocodingUrl: 'https://geocoding-api.open-meteo.com/v1/search',
    marineUrl: 'https://marine-api.open-meteo.com/v1/marine',
    forecastUrl: 'https://api.open-meteo.com/v1/forecast',
    timeoutMs: 10_000,
  }),
});
