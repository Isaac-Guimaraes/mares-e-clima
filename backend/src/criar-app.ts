import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { env } from './config/env.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/error-handler.js';
import { criarRotas } from './routes/index.js';

export function criarApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: env.corsOrigin, methods: ['GET'] }));
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  app.use('/api', criarRotas());
  app.use(rotaNaoEncontrada);
  // Express 5 encaminha automaticamente rejeições de handlers async para cá.
  app.use(tratarErros);

  return app;
}
