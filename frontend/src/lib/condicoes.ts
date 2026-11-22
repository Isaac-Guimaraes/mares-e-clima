import { createElement } from "react";
import { CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Cloud, Moon, Sun, type LucideIcon } from "lucide-react";
import type { ExtremoMare, HoraCondicao, PeriodoFavoravel } from "@/src/lib/tipos";

/** Recortes por dia das séries que o back-end devolve. Horários são strings locais da praia (RNF03). */
export function doDia<T extends { horario: string }>(itens: T[], data: string): T[] {
  return itens.filter((item) => item.horario.startsWith(data));
}

export function janelasDoDia(periodos: PeriodoFavoravel[], data: string): PeriodoFavoravel[] {
  return periodos.filter((p) => p.inicio.startsWith(data));
}

export function proximoExtremo(extremos: ExtremoMare[], agora: string): ExtremoMare | undefined {
  return extremos.find((e) => e.horario > agora);
}

/** Resumo de uma janela favorável em linguagem de praia: maré, ondas e UV (heurística 2 de Nielsen). */
export function resumirJanela(horas: HoraCondicao[], periodo: PeriodoFavoravel) {
  const trecho = horas.filter((h) => h.horario >= periodo.inicio && h.horario < periodo.fim);
  const maximo = (valores: Array<number | null>) => {
    const numeros = valores.filter((v): v is number => v !== null);
    return numeros.length ? Math.max(...numeros) : null;
  };
  return {
    tendencia: trecho[0]?.tendenciaMare ?? null,
    ondaMaxM: maximo(trecho.map((h) => h.alturaOndaM)),
    uvMax: maximo(trecho.map((h) => h.indiceUv)),
  };
}

/** UV a partir de 8 pede proteção extra (OMS: "muito alto"). */
export function uvMerecemAtencao(uv: number | null): boolean {
  return uv !== null && Math.round(uv) >= 8;
}

/** RF06 — Ícone da condição do tempo a partir do código WMO (weather_code da Forecast API). */
export function iconeTempo(codigo: number | null, diurno = true): LucideIcon {
  if (codigo === null) return Cloud;
  if (codigo <= 1) return diurno ? Sun : Moon;
  if (codigo === 2) return CloudSun;
  if (codigo === 3) return Cloud;
  if (codigo === 45 || codigo === 48) return CloudFog;
  if (codigo >= 51 && codigo <= 57) return CloudDrizzle;
  if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return CloudRain;
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return CloudSnow;
  if (codigo >= 95) return CloudLightning;
  return Cloud;
}

/** Ícone decorativo da condição; a descrição em texto sempre vem ao lado (WCAG 1.1.1). */
export function IconeTempo({ codigo, diurno = true, size = 20, className }: { codigo: number | null; diurno?: boolean; size?: number; className?: string }) {
  return createElement(iconeTempo(codigo, diurno), { size, className, "aria-hidden": true });
}
