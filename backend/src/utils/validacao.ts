import { HttpError } from './http-error.js';

interface OpcoesNumero {
  nome: string;
  min: number;
  max: number;
  padrao?: number;
  inteiro?: boolean;
}

/** Converte um parâmetro de query em número dentro de um intervalo, ou lança 400. */
export function lerNumero(valor: unknown, opcoes: OpcoesNumero): number {
  const { nome, min, max, padrao, inteiro = false } = opcoes;

  if (valor === undefined || valor === '') {
    if (padrao !== undefined) return padrao;
    throw HttpError.requisicaoInvalida(`O parâmetro "${nome}" é obrigatório.`);
  }
  if (typeof valor !== 'string') {
    throw HttpError.requisicaoInvalida(`O parâmetro "${nome}" deve ser informado uma única vez.`);
  }

  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    throw HttpError.requisicaoInvalida(`O parâmetro "${nome}" deve ser um número.`);
  }
  if (inteiro && !Number.isInteger(numero)) {
    throw HttpError.requisicaoInvalida(`O parâmetro "${nome}" deve ser um número inteiro.`);
  }
  if (numero < min || numero > max) {
    throw HttpError.requisicaoInvalida(`O parâmetro "${nome}" deve estar entre ${min} e ${max}.`);
  }
  return numero;
}

/** Lê um texto obrigatório com limites de tamanho. */
export function lerTexto(valor: unknown, nome: string, min: number, max: number): string {
  if (typeof valor !== 'string') {
    throw HttpError.requisicaoInvalida(`O parâmetro "${nome}" é obrigatório.`);
  }
  const texto = valor.trim();
  if (texto.length < min || texto.length > max) {
    throw HttpError.requisicaoInvalida(`O parâmetro "${nome}" deve ter entre ${min} e ${max} caracteres.`);
  }
  return texto;
}

/** Lê um valor que precisa pertencer a uma lista fechada. */
export function lerOpcao<T extends string>(valor: unknown, nome: string, opcoes: readonly T[], padrao: T): T {
  if (valor === undefined || valor === '') return padrao;
  if (typeof valor === 'string' && (opcoes as readonly string[]).includes(valor)) return valor as T;
  throw HttpError.requisicaoInvalida(`O parâmetro "${nome}" deve ser um destes valores: ${opcoes.join(', ')}.`);
}

const FUSO_IANA = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){0,2}$/;

/** Valida um fuso horário IANA ("America/Bahia") ou "auto". */
export function lerFusoHorario(valor: unknown): string {
  if (valor === undefined || valor === '') return 'auto';
  if (typeof valor === 'string' && (valor === 'auto' || FUSO_IANA.test(valor))) return valor;
  throw HttpError.requisicaoInvalida('O parâmetro "fuso" deve ser um fuso horário IANA, como America/Bahia.');
}
