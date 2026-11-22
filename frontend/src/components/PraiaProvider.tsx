"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { mensagemDeErro, obterCondicoes } from "@/src/lib/api";
import {
  aplicarTema,
  lerPraiaAtual,
  lerPreferencias,
  listarFavoritos,
  PREFERENCIAS_PADRAO,
  salvarFavoritos,
  salvarPraiaAtual,
  salvarPreferencias,
  type Preferencias,
} from "@/src/lib/preferencias";
import type { Condicoes, Localidade } from "@/src/lib/tipos";

export interface PraiaConsultada {
  localidade: Localidade;
  condicoes: Condicoes;
}

interface ValorPraia {
  /** Última consulta bem-sucedida (continua visível enquanto uma nova carrega). */
  consulta: PraiaConsultada | null;
  /** Praia em carregamento, para a tela dizer qual praia está sendo buscada (heurística 1). */
  carregandoPraia: Localidade | null;
  erro: string | null;
  favoritos: Localidade[];
  ultimaFavoritaRemovida: Localidade | null;
  preferencias: Preferencias;
  preferenciasProntas: boolean;
  mensagemStatus: string;
  selecionarPraia: (localidade: Localidade) => void;
  tentarNovamente: () => void;
  alternarFavorito: (localidade: Localidade) => void;
  desfazerRemocaoFavorita: () => void;
  atualizarPreferencias: (novas: Preferencias) => void;
  anunciar: (mensagem: string) => void;
  consumirFocoPainel: () => boolean;
}

const ContextoPraia = createContext<ValorPraia | null>(null);

export function usePraia(): ValorPraia {
  const valor = useContext(ContextoPraia);
  if (!valor) throw new Error("usePraia precisa estar dentro de PraiaProvider.");
  return valor;
}

interface OpcoesCarga {
  moverFoco: boolean;
  prefixoStatus?: string;
}

/**
 * ESTADO GLOBAL da aplicação (React Context): praia escolhida, condições, loading, erro, favoritos e preferências.
 * Fica no layout das rotas, então o estado sobrevive à navegação entre Início, Hoje, Previsão, Hora a hora e Ajustes.
 */
export function PraiaProvider({ children }: { children: ReactNode }) {
  const [consulta, setConsulta] = useState<PraiaConsultada | null>(null);
  const [carregandoPraia, setCarregandoPraia] = useState<Localidade | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<Localidade[]>([]);
  const [ultimaFavoritaRemovida, setUltimaFavoritaRemovida] = useState<Localidade | null>(null);
  const [preferencias, setPreferencias] = useState<Preferencias>(PREFERENCIAS_PADRAO);
  const [preferenciasProntas, setPreferenciasProntas] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState("");

  const requisicao = useRef<AbortController | null>(null);
  const localidadeAtual = useRef<Localidade | null>(null);
  const preferenciasAtuais = useRef<Preferencias>(PREFERENCIAS_PADRAO);
  const focoPainelPendente = useRef(false);

  const anunciar = useCallback((mensagem: string) => setMensagemStatus(mensagem), []);

  // CONSUMO DE API + LOADING + ERRO: uma consulta por vez; a mais nova cancela a anterior.
  const carregar = useCallback(
    async (localidade: Localidade, prefs: Preferencias, { moverFoco, prefixoStatus = "" }: OpcoesCarga) => {
      localidadeAtual.current = localidade;
      salvarPraiaAtual(localidade);
      requisicao.current?.abort();
      const controle = new AbortController();
      requisicao.current = controle;

      setCarregandoPraia(localidade);
      setErro(null);
      anunciar(`${prefixoStatus}Carregando maré e clima de ${localidade.nome}…`);

      try {
        const condicoes = await obterCondicoes({ localidade, dias: prefs.dias, criterios: prefs.criterios }, controle.signal);
        focoPainelPendente.current = moverFoco;
        setConsulta({ localidade, condicoes });
        const favoraveis = condicoes.periodosFavoraveis.length;
        anunciar(
          `${prefixoStatus}Condições de ${localidade.nome} carregadas. ` +
            (favoraveis ? `${favoraveis} período(s) favorável(is).` : "Nenhum período favorável com os critérios atuais."),
        );
      } catch (falha) {
        const mensagem = mensagemDeErro(falha);
        if (mensagem) {
          setErro(mensagem);
          anunciar(mensagem);
        }
      } finally {
        if (requisicao.current === controle) setCarregandoPraia(null);
      }
    },
    [anunciar],
  );

  // localStorage só existe no navegador: ler aqui evita divergência na hidratação do SSR.
  useEffect(() => {
    const prefs = lerPreferencias();
    preferenciasAtuais.current = prefs;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronização única com o localStorage após hidratar
    setPreferencias(prefs);
    setPreferenciasProntas(true);
    setFavoritos(listarFavoritos());
    const praia = lerPraiaAtual();
    if (praia) void carregar(praia, prefs, { moverFoco: false });
    return () => requisicao.current?.abort();
  }, [carregar]);

  const selecionarPraia = useCallback(
    (localidade: Localidade) => void carregar(localidade, preferenciasAtuais.current, { moverFoco: true }),
    [carregar],
  );

  // Heurística 9 de Nielsen: toda falha oferece um caminho de volta.
  const tentarNovamente = useCallback(() => {
    if (localidadeAtual.current) void carregar(localidadeAtual.current, preferenciasAtuais.current, { moverFoco: false });
  }, [carregar]);

  const alternarFavorito = useCallback(
    (localidade: Localidade) => {
      const atuais = listarFavoritos();
      const existe = atuais.some((l) => l.id === localidade.id);
      const novos = existe ? atuais.filter((l) => l.id !== localidade.id) : [...atuais, localidade];
      salvarFavoritos(novos);
      setFavoritos(novos);
      setUltimaFavoritaRemovida(existe ? localidade : null);
      anunciar(existe ? `${localidade.nome} removida das favoritas.` : `${localidade.nome} adicionada às favoritas.`);
    },
    [anunciar],
  );

  // Heurística 3 de Nielsen (controle e liberdade): remover uma favorita pode ser desfeito.
  const desfazerRemocaoFavorita = useCallback(() => {
    if (!ultimaFavoritaRemovida) return;
    const novos = [...listarFavoritos(), ultimaFavoritaRemovida];
    salvarFavoritos(novos);
    setFavoritos(novos);
    anunciar(`${ultimaFavoritaRemovida.nome} voltou para as favoritas.`);
    setUltimaFavoritaRemovida(null);
  }, [anunciar, ultimaFavoritaRemovida]);

  const atualizarPreferencias = useCallback(
    (novas: Preferencias) => {
      salvarPreferencias(novas);
      preferenciasAtuais.current = novas;
      setPreferencias(novas);
      aplicarTema(novas.tema);
      if (localidadeAtual.current) {
        // O foco fica onde está: salvar não muda de página nem de contexto (WCAG 3.2.2).
        void carregar(localidadeAtual.current, novas, { moverFoco: false, prefixoStatus: "Preferências salvas. " });
      } else {
        anunciar("Preferências salvas.");
      }
    },
    [anunciar, carregar],
  );

  /** A tela Hoje chama isto após renderizar para mover o foco ao título uma única vez (WCAG 2.4.3). */
  const consumirFocoPainel = useCallback(() => {
    const pendente = focoPainelPendente.current;
    focoPainelPendente.current = false;
    return pendente;
  }, []);

  const valor = useMemo<ValorPraia>(
    () => ({
      consulta,
      carregandoPraia,
      erro,
      favoritos,
      ultimaFavoritaRemovida,
      preferencias,
      preferenciasProntas,
      mensagemStatus,
      selecionarPraia,
      tentarNovamente,
      alternarFavorito,
      desfazerRemocaoFavorita,
      atualizarPreferencias,
      anunciar,
      consumirFocoPainel,
    }),
    [
      consulta,
      carregandoPraia,
      erro,
      favoritos,
      ultimaFavoritaRemovida,
      preferencias,
      preferenciasProntas,
      mensagemStatus,
      selecionarPraia,
      tentarNovamente,
      alternarFavorito,
      desfazerRemocaoFavorita,
      atualizarPreferencias,
      anunciar,
      consumirFocoPainel,
    ],
  );

  return <ContextoPraia.Provider value={valor}>{children}</ContextoPraia.Provider>;
}
