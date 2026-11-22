"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { LocateFixed } from "lucide-react";
import { AvisoErro, AvisoInfo } from "@/src/components/Avisos";
import { MINIMO_LETRAS } from "@/src/components/CampoBusca";
import { Esqueleto } from "@/src/components/EstadoPraia";
import { ListaLocais } from "@/src/components/ListaLocais";
import type { DestinoMapa } from "@/src/components/MapaPraias";
import { usePraia } from "@/src/components/PraiaProvider";
import { buscarLocalidades, buscarPraiasNaArea, mensagemDeErro } from "@/src/lib/api";
import { areaPequena, arredondarLimites, distanciaKm, formatarDistancia } from "@/src/lib/geo";
import type { Coordenada, LimitesMapa, Localidade } from "@/src/lib/tipos";

// O Leaflet usa window: o mapa só é carregado no navegador. Enquanto isso, um espaço do mesmo tamanho.
const MapaPraias = dynamic(() => import("@/src/components/MapaPraias"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[1.25rem] bg-mares-superficie-alta" />,
});

const CENTRO_BRASIL: Coordenada = { latitude: -14.5, longitude: -42 };

interface Resposta {
  chave: string;
  praias: Localidade[] | null;
  erro: string | null;
}

type EstadoLocalizacao = { tipo: "ocioso" } | { tipo: "localizando" } | { tipo: "erro"; mensagem: string };

const ERROS_LOCALIZACAO: Record<number, string> = {
  1: "Você não permitiu o acesso à localização. Libere a permissão no navegador ou navegue pelo mapa.",
  2: "Não conseguimos descobrir sua localização agora. Navegue pelo mapa ou busque pelo nome.",
  3: "A localização demorou demais para responder. Tente de novo ou navegue pelo mapa.",
};

/** Busca por nome (GET /api/localidades), com o termo na URL. */
function useBuscaPorNome(termo: string, tentativa: number) {
  const { anunciar } = usePraia();
  const [resposta, setResposta] = useState<Resposta>({ chave: "", praias: null, erro: null });
  const valido = termo.length >= MINIMO_LETRAS;
  const chave = `${termo}#${tentativa}`;

  useEffect(() => {
    if (!valido) return;
    const controle = new AbortController();
    anunciar(`Buscando “${termo}”…`);
    buscarLocalidades(termo, controle.signal)
      .then((praias) => {
        setResposta({ chave, praias, erro: null });
        anunciar(praias.length ? `${praias.length} resultado(s) para “${termo}”.` : `Nenhuma praia encontrada para “${termo}”.`);
      })
      .catch((falha: unknown) => {
        const mensagem = mensagemDeErro(falha);
        if (mensagem) setResposta({ chave, praias: null, erro: mensagem });
      });
    return () => controle.abort();
  }, [chave, termo, valido, anunciar]);

  const atual = resposta.chave === chave;
  return { valido, carregando: valido && !atual, praias: atual ? resposta.praias : null, erro: atual ? resposta.erro : null };
}

/** Praias da área visível do mapa (GET /api/praias), com espera curta para não consultar a cada arrasto. */
function usePraiasNaArea(limites: LimitesMapa | null, referencia: Coordenada | null, tentativa: number) {
  const [resposta, setResposta] = useState<Resposta>({ chave: "", praias: null, erro: null });
  const area = limites ? arredondarLimites(limites) : null;
  const pequena = area !== null && areaPequena(area);
  const chave = area && pequena ? `${JSON.stringify(area)}|${referencia?.latitude ?? ""}|${tentativa}` : "";

  useEffect(() => {
    if (!chave || !area) return;
    const controle = new AbortController();
    const espera = setTimeout(() => {
      buscarPraiasNaArea(area, referencia, controle.signal)
        .then((praias) => setResposta({ chave, praias, erro: null }))
        .catch((falha: unknown) => {
          const mensagem = mensagemDeErro(falha);
          if (mensagem) setResposta({ chave, praias: null, erro: mensagem });
        });
    }, 400);
    return () => {
      clearTimeout(espera);
      controle.abort();
    };
    // area e referencia já estão representadas na chave
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const atual = resposta.chave === chave;
  return {
    pequena,
    carregando: pequena && !atual,
    praias: atual ? resposta.praias : null,
    // Enquanto a área nova carrega, as praias anteriores continuam no mapa e na lista:
    // os pinos não piscam e um balão aberto não fecha quando o mapa se desloca para mostrá-lo.
    anteriores: pequena ? resposta.praias : null,
    erro: atual ? resposta.erro : null,
  };
}

/**
 * Rota "/busca" — encontrar a praia pelo nome, pelo mapa ou pela localização atual (RF01).
 * "?q=" guarda o termo buscado; "?perto=1" já abre pedindo a localização.
 */
export function PaginaBusca() {
  const router = useRouter();
  const parametros = useSearchParams();
  const termo = (parametros.get("q") ?? "").trim();
  const pedirLocalizacaoAoAbrir = parametros.get("perto") === "1";
  const { consulta, selecionarPraia, anunciar } = usePraia();

  const [tentativaNome, setTentativaNome] = useState(0);
  const [tentativaArea, setTentativaArea] = useState(0);
  const [limites, setLimites] = useState<LimitesMapa | null>(null);
  const [minhaPosicao, setMinhaPosicao] = useState<Coordenada | null>(null);
  const [localizacao, setLocalizacao] = useState<EstadoLocalizacao>({ tipo: "ocioso" });
  const [destino, setDestino] = useState<DestinoMapa | null>(null);
  const contadorDestino = useRef(0);

  const porNome = useBuscaPorNome(termo, tentativaNome);
  const naArea = usePraiasNaArea(limites, minhaPosicao, tentativaArea);

  // Começa onde faz sentido: na última praia consultada ou no litoral do Brasil inteiro.
  const [inicio] = useState(() => (consulta ? { centro: consulta.localidade, zoom: 12 } : { centro: CENTRO_BRASIL, zoom: 4 }));

  // Só troca o estado quando a área muda de verdade. Sem isso, o balão aberto (que reposiciona o mapa
  // a cada renderização) e o aviso de área nova se realimentavam num laço infinito em telas estreitas.
  const atualizarLimites = useCallback((novos: LimitesMapa) => {
    setLimites((atuais) => {
      const igual = (a: number, b: number) => Math.abs(a - b) < 1e-6;
      return atuais && igual(atuais.sul, novos.sul) && igual(atuais.oeste, novos.oeste) && igual(atuais.norte, novos.norte) && igual(atuais.leste, novos.leste)
        ? atuais
        : novos;
    });
  }, []);

  const irPara = useCallback((d: Omit<DestinoMapa, "chave">) => {
    contadorDestino.current += 1;
    setDestino({ ...d, chave: contadorDestino.current });
  }, []);

  // Ao chegar o resultado da busca por nome, o mapa enquadra as praias encontradas.
  useEffect(() => {
    if (porNome.praias && porNome.praias.length > 0) irPara({ pontos: porNome.praias });
  }, [porNome.praias, irPara]);

  const usarLocalizacao = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocalizacao({ tipo: "erro", mensagem: "Este navegador não informa a localização. Navegue pelo mapa ou busque pelo nome." });
      return;
    }
    setLocalizacao({ tipo: "localizando" });
    anunciar("Procurando sua localização…");
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const aqui = { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
        setMinhaPosicao(aqui);
        setLocalizacao({ tipo: "ocioso" });
        irPara({ centro: aqui, zoom: 11 });
        anunciar("Localização encontrada. Mostrando as praias mais perto de você.");
      },
      (erro) => {
        const mensagem = ERROS_LOCALIZACAO[erro.code] ?? ERROS_LOCALIZACAO[2]!;
        setLocalizacao({ tipo: "erro", mensagem });
        anunciar(mensagem);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, [anunciar, irPara]);

  // Veio do botão "Praias perto de mim" do Início: o pedido de localização foi um clique do usuário.
  useEffect(() => {
    if (pedirLocalizacaoAoAbrir) queueMicrotask(usarLocalizacao);
  }, [pedirLocalizacaoAoAbrir, usarLocalizacao]);

  function abrir(praia: Localidade) {
    selecionarPraia(praia);
    router.push("/hoje");
  }

  // No mapa: resultados da busca por nome e praias da área, sem repetir.
  const marcadores = useMemo(() => {
    const todos = [...(porNome.praias ?? []), ...(naArea.praias ?? naArea.anteriores ?? [])];
    return todos.filter((p, i) => todos.findIndex((q) => q.id === p.id) === i);
  }, [porNome.praias, naArea.praias, naArea.anteriores]);
  const listaArea = naArea.praias ?? naArea.anteriores;

  const distancia = minhaPosicao ? (p: Localidade) => `a ${formatarDistancia(distanciaKm(minhaPosicao, p))} de você` : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {termo ? (
            <>
              <p className="text-sm font-semibold tracking-wider text-mares-link uppercase">Resultados para</p>
              <h1 className="titulo-tela">{termo}</h1>
            </>
          ) : (
            <h1 className="titulo-tela">Encontre sua praia</h1>
          )}
          <p className="dica mt-1">Busque pelo nome no topo, use sua localização ou navegue pelo mapa.</p>
        </div>
        {/* Heurística 7: atalho para quem está na praia ou perto dela. */}
        <button type="button" className="botao botao-primario" onClick={usarLocalizacao} disabled={localizacao.tipo === "localizando"}>
          <LocateFixed size={18} />
          {localizacao.tipo === "localizando" ? "Localizando…" : "Usar minha localização"}
        </button>
      </div>

      {localizacao.tipo === "erro" && <AvisoErro mensagem={localizacao.mensagem} aoTentarNovamente={usarLocalizacao} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="min-w-0 space-y-8">
          {termo && (
            <section aria-labelledby="titulo-por-nome" className="space-y-3">
              <h2 id="titulo-por-nome" className="titulo-secao">
                Pelo nome
              </h2>
              {!porNome.valido && <AvisoInfo>Digite pelo menos {MINIMO_LETRAS} letras na busca do topo.</AvisoInfo>}
              {porNome.carregando && (
                <div aria-busy="true">
                  <Esqueleto linhas={2} />
                </div>
              )}
              {porNome.erro && <AvisoErro mensagem={porNome.erro} aoTentarNovamente={() => setTentativaNome((t) => t + 1)} />}
              {porNome.praias?.length === 0 && (
                // Heurística 9: diz o que fazer, não só que falhou.
                <div className="cartao space-y-2">
                  <p className="font-semibold">Nenhuma praia do litoral encontrada para “{termo}”.</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Confira a grafia ou tente o nome da cidade ou do bairro.</li>
                    <li>Use “Usar minha localização” ou o mapa para ver as praias de uma região.</li>
                  </ul>
                </div>
              )}
              {porNome.praias && porNome.praias.length > 0 && (
                <ListaLocais localidades={porNome.praias} aoSelecionar={abrir} acao="ver condições de hoje" detalhe={distancia} />
              )}
            </section>
          )}

          <section aria-labelledby="titulo-na-area" className="space-y-3">
            <h2 id="titulo-na-area" className="titulo-secao">
              {minhaPosicao ? "Perto de você" : "Nesta área do mapa"}
            </h2>
            {!naArea.pequena && (
              <AvisoInfo>Aproxime o mapa de um trecho do litoral, ou use sua localização, para ver as praias da região.</AvisoInfo>
            )}
            {naArea.carregando && !listaArea && (
              <div aria-busy="true">
                <Esqueleto linhas={3} />
              </div>
            )}
            {naArea.carregando && listaArea && <p className="chip bg-mares-info text-mares-titulo">Atualizando as praias da área…</p>}
            {naArea.erro && <AvisoErro mensagem={naArea.erro} aoTentarNovamente={() => setTentativaArea((t) => t + 1)} />}
            {listaArea?.length === 0 && <p className="cartao">Não há praias com dados de maré nesta área. Mova o mapa para o litoral.</p>}
            {listaArea && listaArea.length > 0 && (
              <ListaLocais localidades={listaArea.slice(0, 20)} aoSelecionar={abrir} acao="ver condições de hoje" detalhe={distancia} />
            )}
          </section>
        </div>

        <section aria-labelledby="titulo-mapa" className="min-w-0 space-y-2 lg:sticky lg:top-4 lg:self-start">
          <h2 id="titulo-mapa" className="sr-only">
            Mapa de praias
          </h2>
          <div className="h-[24rem] overflow-hidden rounded-[1.25rem] border border-mares-divisoria sm:h-[32rem] lg:h-[40rem]">
            <MapaPraias
              praias={marcadores}
              minhaPosicao={minhaPosicao}
              centroInicial={inicio.centro}
              zoomInicial={inicio.zoom}
              destino={destino}
              aoMover={atualizarLimites}
              aoEscolher={abrir}
            />
          </div>
          <p className="dica">
            Toque num marcador para ver a praia. As mesmas praias estão na lista. Sua localização só centraliza o mapa e não fica
            salva.
          </p>
        </section>
      </div>
    </div>
  );
}
