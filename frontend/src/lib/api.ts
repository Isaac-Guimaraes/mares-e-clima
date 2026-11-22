import type { Condicoes, ConsultaCondicoes, Coordenada, LimitesMapa, Localidade } from "@/src/lib/tipos";

/*
 * CONSUMO DE API NO FRONT-END
 * O navegador conversa só com o back-end do projeto (NEXT_PUBLIC_API_URL). É o back-end que chama
 * as APIs públicas do Open-Meteo, aplica o cache de 60 min (RNF01) e junta maré com clima (RF07).
 * Procure por "[API PÚBLICA]" no código do back-end para ver cada chamada ao Open-Meteo.
 */
// Sem a variável, usa o mesmo servidor do site na porta da API (as chamadas só acontecem no navegador).
function urlDaApi(): string {
  return process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:3333`;
}

/** Erro com mensagem já pronta para mostrar ao usuário (RNF06). */
export class ErroApi extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ErroApi";
  }
}

/** Converte qualquer falha em texto para a tela; devolve null quando a consulta foi cancelada por outra mais nova. */
export function mensagemDeErro(erro: unknown): string | null {
  if (erro instanceof DOMException && erro.name === "AbortError") return null;
  if (erro instanceof ErroApi) return erro.message;
  console.error(erro);
  return "Algo deu errado. Tente novamente.";
}

interface CorpoErro {
  erro?: { mensagem?: string };
}

async function obterJson<T>(caminho: string, parametros: Record<string, string>, sinal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams(parametros).toString();
  let resposta: Response;
  try {
    resposta = await fetch(`${urlDaApi()}/api${caminho}?${query}`, {
      headers: { Accept: "application/json" },
      ...(sinal ? { signal: sinal } : {}),
    });
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === "AbortError") throw erro;
    throw new ErroApi("Não conseguimos carregar os dados. Confira sua internet e tente de novo.", 0);
  }

  if (!resposta.ok) {
    let mensagem = "Não foi possível concluir a consulta. Tente novamente.";
    try {
      const corpo = (await resposta.json()) as CorpoErro;
      if (corpo.erro?.mensagem) mensagem = corpo.erro.mensagem;
    } catch {
      // resposta sem JSON
    }
    throw new ErroApi(mensagem, resposta.status);
  }
  return (await resposta.json()) as T;
}

/**
 * GET /api/localidades → no back-end: Open-Meteo Geocoding API + Marine API (filtro de litoral).
 * Ver backend/src/services/geocoding.service.ts.
 */
export async function buscarLocalidades(nome: string, sinal?: AbortSignal): Promise<Localidade[]> {
  const corpo = await obterJson<{ resultados: Localidade[] }>("/localidades", { nome }, sinal);
  return corpo.resultados;
}

/**
 * GET /api/praias → no back-end: base local de praias do OpenStreetMap + Marine API (só praias com maré).
 * Ver backend/src/services/praias.service.ts.
 */
export async function buscarPraiasNaArea(limites: LimitesMapa, referencia: Coordenada | null, sinal?: AbortSignal): Promise<Localidade[]> {
  const parametros: Record<string, string> = {
    sul: String(limites.sul),
    oeste: String(limites.oeste),
    norte: String(limites.norte),
    leste: String(limites.leste),
  };
  if (referencia) {
    parametros.lat = String(referencia.latitude);
    parametros.lon = String(referencia.longitude);
  }
  const corpo = await obterJson<{ praias: Localidade[] }>("/praias", parametros, sinal);
  return corpo.praias;
}

/**
 * GET /api/condicoes → no back-end: Open-Meteo Marine Weather API + Weather Forecast API, em paralelo.
 * Ver backend/src/services/marine.service.ts e forecast.service.ts.
 */
export function obterCondicoes(consulta: ConsultaCondicoes, sinal?: AbortSignal): Promise<Condicoes> {
  const { localidade, dias, criterios } = consulta;
  return obterJson<Condicoes>(
    "/condicoes",
    {
      lat: String(localidade.latitude),
      lon: String(localidade.longitude),
      fuso: localidade.fusoHorario,
      dias: String(dias),
      chuvaMax: String(criterios.probabilidadeChuvaMax),
      ventoMax: String(criterios.ventoMaxKmh),
      mare: criterios.preferenciaMare,
    },
    sinal,
  );
}
