import { env } from './config/env.js';
import app from './index.js';

const servidor = app.listen(env.porta, () => {
  console.log(`API Marés e Clima ouvindo na porta ${env.porta}`);
});

function encerrar(sinal: string): void {
  console.log(`${sinal} recebido, encerrando...`);
  servidor.close(() => process.exit(0));
}

process.on('SIGINT', () => encerrar('SIGINT'));
process.on('SIGTERM', () => encerrar('SIGTERM'));
