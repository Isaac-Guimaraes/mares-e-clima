import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error.js';

/** Corpo padrão de erro da API: { erro: { codigo, mensagem } } (RNF06). */
export function tratarErros(erro: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (erro instanceof HttpError) {
    res.status(erro.status).json({ erro: { codigo: erro.codigo, mensagem: erro.message } });
    return;
  }
  console.error('[erro não tratado]', erro);
  res.status(500).json({
    erro: { codigo: 'erro_interno', mensagem: 'Ocorreu um erro inesperado. Tente novamente em instantes.' },
  });
}

export function rotaNaoEncontrada(req: Request, res: Response): void {
  res.status(404).json({ erro: { codigo: 'nao_encontrado', mensagem: `Rota ${req.method} ${req.path} não existe.` } });
}
