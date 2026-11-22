import { criarApp } from './app.js';
import { env } from './config/env.js';

const servidor = criarApp().listen(env.porta, () => {
  console.log(`API Marés e Clima ouvindo na porta ${env.porta}`);
});

function encerrar(sinal: string): void {
  console.log(`${sinal} recebido, encerrando...`);
  servidor.close(() => process.exit(0));
}

process.on('SIGINT', () => encerrar('SIGINT'));
process.on('SIGTERM', () => encerrar('SIGTERM'));
