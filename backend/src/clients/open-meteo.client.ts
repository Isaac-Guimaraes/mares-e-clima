import { HttpError } from '../utils/http-error.js';

export type Parametros = Record<string, string | number | readonly string[] | undefined>;

/** Assinatura usada pelos services; permite trocar por um dublê nos testes. */
export type BuscarJson = <T>(urlBase: string, parametros: Parametros) => Promise<T>;

interface ErroOpenMeteo {
  error?: boolean;
  reason?: string;
}

/** Monta a URL com os parâmetros de query; listas viram valores separados por vírgula. */
export function montarUrl(urlBase: string, parametros: Parametros): URL {
  const url = new URL(urlBase);
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === '') continue;
    url.searchParams.set(chave, Array.isArray(valor) ? valor.join(',') : String(valor));
  }
  return url;
}

/**
 * Cliente HTTP único para todas as APIs do Open-Meteo.
 * Única camada que faz requisições de rede; services nunca chamam fetch diretamente.
 */
export function criarClienteOpenMeteo(timeoutMs: number, fetchFn: typeof fetch = fetch): BuscarJson {
  return async function buscarJson<T>(urlBase: string, parametros: Parametros): Promise<T> {
    const url = montarUrl(urlBase, parametros);

    let resposta: Response;
    try {
      // [API PÚBLICA] Único fetch do projeto para o Open-Meteo: Geocoding, Marine e Forecast passam por aqui.
      resposta = await fetchFn(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (erro) {
      const tempoEsgotado = erro instanceof DOMException && erro.name === 'TimeoutError';
      throw HttpError.servicoExterno(
        tempoEsgotado
          ? 'O serviço de previsão demorou demais para responder. Tente novamente em instantes.'
          : 'Não foi possível conectar ao serviço de previsão. Verifique a conexão e tente novamente.',
      );
    }

    if (!resposta.ok) {
      let motivo = `HTTP ${resposta.status}`;
      try {
        const corpo = (await resposta.json()) as ErroOpenMeteo;
        if (corpo.reason) motivo = corpo.reason;
      } catch {
        // corpo não é JSON; mantém o status
      }
      console.error(`[open-meteo] ${url.hostname}${url.pathname}: ${motivo}`);
      throw HttpError.servicoExterno('O serviço de previsão recusou a consulta. Tente outra localidade.');
    }

    return (await resposta.json()) as T;
  };
}
