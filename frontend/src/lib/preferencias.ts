import type { CriteriosRecomendacao, Localidade } from "@/src/lib/tipos";

const CHAVE_FAVORITOS = "mares-e-clima:favoritos";
const CHAVE_CRITERIOS = "mares-e-clima:criterios";
const CHAVE_DIAS = "mares-e-clima:dias";
const CHAVE_TEMA = "mares-e-clima:tema";
const CHAVE_PRAIA_ATUAL = "mares-e-clima:praia-atual";

export const DIAS_PERMITIDOS = [1, 3, 5, 7];

export type Tema = "claro" | "escuro" | "sistema";

export interface Preferencias {
  dias: number;
  criterios: CriteriosRecomendacao;
  tema: Tema;
}

// Valores de partida do escopo (seção 7.2): chuva < 30%, vento < 25 km/h.
export const PREFERENCIAS_PADRAO: Preferencias = {
  dias: 3,
  criterios: { probabilidadeChuvaMax: 30, ventoMaxKmh: 25, preferenciaMare: "indiferente" },
  tema: "sistema",
};

/**
 * RF09 — Favoritos e preferências salvos no navegador (localStorage).
 * O armazenamento pode estar indisponível (modo privado, servidor): toda leitura e escrita é protegida.
 */
function armazenamento(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function ler(chave: string): unknown {
  try {
    const bruto = armazenamento()?.getItem(chave);
    return bruto ? (JSON.parse(bruto) as unknown) : null;
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: unknown): void {
  try {
    armazenamento()?.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem espaço ou sem permissão: segue sem persistir.
  }
}

function limitar(valor: unknown, minimo: number, maximo: number, padrao: number): number {
  const texto = typeof valor === "string" ? valor.trim() : valor;
  if (texto === "" || (typeof texto !== "string" && typeof texto !== "number")) return padrao;
  const numero = Number(texto);
  return Number.isFinite(numero) ? Math.min(Math.max(numero, minimo), maximo) : padrao;
}

/** Aceita valores do formulário ou do localStorage e devolve critérios dentro dos limites da API. */
export function normalizarCriterios(bruto: {
  probabilidadeChuvaMax?: unknown;
  ventoMaxKmh?: unknown;
  preferenciaMare?: unknown;
}): CriteriosRecomendacao {
  const { criterios: padrao } = PREFERENCIAS_PADRAO;
  const mare = bruto.preferenciaMare;
  return {
    probabilidadeChuvaMax: limitar(bruto.probabilidadeChuvaMax, 0, 100, padrao.probabilidadeChuvaMax),
    ventoMaxKmh: limitar(bruto.ventoMaxKmh, 0, 150, padrao.ventoMaxKmh),
    preferenciaMare: mare === "alta" || mare === "baixa" ? mare : "indiferente",
  };
}

export function lerPreferencias(): Preferencias {
  const criterios = ler(CHAVE_CRITERIOS);
  const dias = ler(CHAVE_DIAS);
  const tema = ler(CHAVE_TEMA);
  return {
    dias: typeof dias === "number" && DIAS_PERMITIDOS.includes(dias) ? dias : PREFERENCIAS_PADRAO.dias,
    criterios: normalizarCriterios(typeof criterios === "object" && criterios !== null ? criterios : {}),
    tema: tema === "claro" || tema === "escuro" ? tema : "sistema",
  };
}

export function salvarPreferencias({ dias, criterios, tema }: Preferencias): void {
  gravar(CHAVE_DIAS, dias);
  gravar(CHAVE_CRITERIOS, criterios);
  gravar(CHAVE_TEMA, tema);
}

/** "sistema" remove o atributo e deixa o prefers-color-scheme decidir. */
export function aplicarTema(tema: Tema): void {
  if (tema === "sistema") delete document.documentElement.dataset.tema;
  else document.documentElement.dataset.tema = tema;
}

export function listarFavoritos(): Localidade[] {
  const lista = ler(CHAVE_FAVORITOS);
  return Array.isArray(lista) ? (lista as Localidade[]) : [];
}

export function salvarFavoritos(lista: Localidade[]): void {
  gravar(CHAVE_FAVORITOS, lista);
}

/** A praia escolhida sobrevive a um recarregamento em qualquer rota. */
export function lerPraiaAtual(): Localidade | null {
  const praia = ler(CHAVE_PRAIA_ATUAL);
  if (typeof praia !== "object" || praia === null) return null;
  const candidata = praia as Partial<Localidade>;
  return typeof candidata.latitude === "number" && typeof candidata.longitude === "number" && typeof candidata.nome === "string"
    ? (candidata as Localidade)
    : null;
}

export function salvarPraiaAtual(localidade: Localidade): void {
  gravar(CHAVE_PRAIA_ATUAL, localidade);
}
