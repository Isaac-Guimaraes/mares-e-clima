/**
 * Formatação em português. Os horários da API já vêm no fuso da praia
 * ("AAAA-MM-DDTHH:MM", sem deslocamento), então tratamos como UTC "ingênuo"
 * apenas para o Intl não convertê-los para o fuso do navegador (RNF03).
 */

const formatoDia = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const formatoDiaCurto = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const numero1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const numero2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function comoUtc(horarioOuData: string): Date {
  const iso = horarioOuData.length === 10 ? `${horarioOuData}T00:00` : horarioOuData;
  return new Date(`${iso}:00Z`);
}

/**
 * Hora cheia atual no fuso da praia, no mesmo formato da API ("AAAA-MM-DDTHH:00").
 * Permite destacar "agora" mesmo quando o navegador está em outro fuso.
 */
export function horaAtualNoFuso(fusoHorario: string, agora = new Date()): string {
  const opcoes: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  };
  let partes: Intl.DateTimeFormatPart[];
  try {
    partes = new Intl.DateTimeFormat("en-CA", { ...opcoes, timeZone: fusoHorario }).formatToParts(agora);
  } catch {
    // Fuso desconhecido pelo navegador: usa o fuso local.
    partes = new Intl.DateTimeFormat("en-CA", opcoes).formatToParts(agora);
  }
  const p = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((x) => x.type === tipo)?.value ?? "00";
  return `${p("year")}-${p("month")}-${p("day")}T${p("hour")}:00`;
}

/** Hora e minuto atuais no fuso da praia ("09:41"), para o marcador "Agora". */
export function horarioAtualNoFuso(fusoHorario: string, agora = new Date()): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: fusoHorario, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(agora);
  } catch {
    return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(agora);
  }
}

/** "2026-11-21" + 1 → "2026-11-22" */
export function somarDias(data: string, dias: number): string {
  const d = comoUtc(data);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

const formatoSemanaCurta = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

/** Rótulo curto e familiar do dia (heurística 2 de Nielsen): "Hoje", "Amanhã", "Qui". */
export function rotuloDia(data: string, hoje: string): string {
  if (data === hoje) return "Hoje";
  if (data === somarDias(hoje, 1)) return "Amanhã";
  const semana = formatoSemanaCurta.format(comoUtc(data)).replace(".", "");
  return semana.charAt(0).toUpperCase() + semana.slice(1);
}

/** "há 12 min": mostra se o dado ainda é recente (heurística 1 de Nielsen). */
export function tempoDesde(iso: string, agora = new Date()): string {
  const minutos = Math.round((agora.getTime() - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(minutos) || minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;
  return `há ${Math.floor(minutos / 60)} h`;
}

/** "2026-11-09T14:00" → "14:00" */
export function hora(horario: string): string {
  return horario.slice(11, 16);
}

/** "2026-11-09" → "segunda-feira, 9 de novembro" */
export function dataPorExtenso(data: string): string {
  return formatoDia.format(comoUtc(data));
}

/** "2026-11-09" → "seg., 9 de nov." */
export function dataCurta(data: string): string {
  return formatoDiaCurto.format(comoUtc(data));
}

export function graus(valor: number | null): string {
  return valor === null ? "—" : `${Math.round(valor)} °C`;
}

export function metros(valor: number | null, casas: 1 | 2 = 1): string {
  if (valor === null) return "—";
  return `${(casas === 2 ? numero2 : numero1).format(valor)} m`;
}

export function porcentagem(valor: number | null): string {
  return valor === null ? "—" : `${Math.round(valor)}%`;
}

export function velocidade(valor: number | null): string {
  return valor === null ? "—" : `${Math.round(valor)} km/h`;
}

export function segundos(valor: number | null): string {
  return valor === null ? "—" : `${Math.round(valor)} s`;
}

const PONTOS_CARDEAIS = ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"] as const;
const SIGLAS = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"] as const;

/** 135 → { sigla: "SE", nome: "sudeste" }. A sigla é visual; o nome vai para leitores de tela. */
export function direcao(grausDirecao: number | null): { sigla: string; nome: string } {
  if (grausDirecao === null) return { sigla: "—", nome: "direção desconhecida" };
  const indice = Math.round((((grausDirecao % 360) + 360) % 360) / 45) % 8;
  return { sigla: SIGLAS[indice] ?? "—", nome: PONTOS_CARDEAIS[indice] ?? "direção desconhecida" };
}

export function tendencia(valor: "enchendo" | "vazando" | "estavel" | null): string {
  switch (valor) {
    case "enchendo":
      return "Enchendo";
    case "vazando":
      return "Vazando";
    case "estavel":
      return "Estável";
    default:
      return "—";
  }
}

/** Só a classe do índice UV ("baixo", "muito alto"), para quando o número já aparece ao lado. */
export function classeUv(indice: number | null): string {
  return /\((.+)\)/.exec(nivelUv(indice))?.[1] ?? "—";
}

/** Classificação do índice UV segundo a OMS. */
export function nivelUv(indice: number | null): string {
  if (indice === null) return "—";
  const arredondado = Math.round(indice);
  if (arredondado <= 2) return `${arredondado} (baixo)`;
  if (arredondado <= 5) return `${arredondado} (moderado)`;
  if (arredondado <= 7) return `${arredondado} (alto)`;
  if (arredondado <= 10) return `${arredondado} (muito alto)`;
  return `${arredondado} (extremo)`;
}
