/**
 * Erro com status HTTP e mensagem pronta para o usuário (em português).
 * Lançado por services e utilitários; convertido em resposta pelo error-handler.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly codigo: string = 'erro',
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static requisicaoInvalida(mensagem: string): HttpError {
    return new HttpError(400, mensagem, 'requisicao_invalida');
  }

  static naoEncontrado(mensagem: string): HttpError {
    return new HttpError(404, mensagem, 'nao_encontrado');
  }

  static servicoExterno(mensagem: string): HttpError {
    return new HttpError(502, mensagem, 'servico_externo');
  }
}
