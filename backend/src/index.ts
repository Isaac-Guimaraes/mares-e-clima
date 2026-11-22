import { criarApp } from './criar-app.js';

/**
 * Ponto de entrada da API. No Vercel, o app exportado aqui roda como Vercel Function;
 * localmente, servidor-local.ts importa este mesmo app e abre a porta.
 */
const app = criarApp();

export default app;
