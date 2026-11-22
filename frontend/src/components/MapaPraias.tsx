"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { divIcon, latLngBounds, type Marker as MarcadorLeaflet, type Point } from "leaflet";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { BotaoFavorito, descreverLocal } from "@/src/components/ListaLocais";
import type { Coordenada, LimitesMapa, Localidade } from "@/src/lib/tipos";

/** Pedido para o mapa ir a um lugar; a "chave" muda a cada pedido, mesmo para o mesmo destino. */
export interface DestinoMapa {
  chave: number;
  centro?: Coordenada;
  zoom?: number;
  pontos?: Coordenada[];
}

interface PropsMapa {
  praias: Localidade[];
  minhaPosicao: Coordenada | null;
  centroInicial: Coordenada;
  zoomInicial: number;
  destino: DestinoMapa | null;
  aoMover: (limites: LimitesMapa) => void;
  aoEscolher: (praia: Localidade) => void;
}

// Marcador com as cores do manual (pino em Maré com ponto de Sol). O HTML é fixo: nenhum dado da API entra aqui.
const ICONE_PRAIA = divIcon({
  className: "",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
  html: '<svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 39C16 39 2 24 2 15a14 14 0 0 1 28 0c0 9-14 24-14 24z" fill="#1a6fa0" stroke="#ffffff" stroke-width="2"/><circle cx="16" cy="15" r="6" fill="#f5b335"/></svg>',
});

const movimentoReduzido = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function OuvirMovimento({ aoMover }: { aoMover: (limites: LimitesMapa) => void }) {
  const mapa = useMapEvents({
    moveend: () => {
      const b = mapa.getBounds();
      aoMover({ sul: b.getSouth(), oeste: b.getWest(), norte: b.getNorth(), leste: b.getEast() });
    },
  });
  // Informa a área inicial uma vez, para a lista já começar preenchida.
  useEffect(() => {
    const b = mapa.getBounds();
    aoMover({ sul: b.getSouth(), oeste: b.getWest(), norte: b.getNorth(), leste: b.getEast() });
  }, [mapa, aoMover]);
  return null;
}

function IrPara({ destino }: { destino: DestinoMapa | null }) {
  const mapa = useMap();
  useEffect(() => {
    if (!destino) return;
    const animar = !movimentoReduzido(); // WCAG 2.3.3
    if (destino.pontos && destino.pontos.length > 1) {
      mapa.fitBounds(latLngBounds(destino.pontos.map((p) => [p.latitude, p.longitude])), { padding: [40, 40], maxZoom: 13, animate: animar });
    } else {
      const alvo = destino.centro ?? destino.pontos?.[0];
      if (alvo) mapa.setView([alvo.latitude, alvo.longitude], destino.zoom ?? 13, { animate: animar });
    }
  }, [mapa, destino]);
  return null;
}

/**
 * Mapa de praias (Leaflet + OpenStreetMap). Os marcadores recebem o teclado (Tab e Enter) e um nome
 * acessível; a lista ao lado do mapa traz as mesmas praias em texto (WCAG 1.1.1 e 2.1.1).
 */
export default function MapaPraias({ praias, minhaPosicao, centroInicial, zoomInicial, destino, aoMover, aoEscolher }: PropsMapa) {
  return (
    <MapContainer
      center={[centroInicial.latitude, centroInicial.longitude]}
      zoom={zoomInicial}
      scrollWheelZoom
      className="h-full w-full rounded-[1.25rem]"
    >
      {/* Mapa base do OpenStreetMap: a atribuição é obrigatória pela licença ODbL. */}
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={18}
      />
      <OuvirMovimento aoMover={aoMover} />
      <IrPara destino={destino} />

      {minhaPosicao && (
        <CircleMarker
          center={[minhaPosicao.latitude, minhaPosicao.longitude]}
          radius={9}
          pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#0e3b5c", fillOpacity: 1 }}
          interactive={false}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            Você está aqui
          </Tooltip>
        </CircleMarker>
      )}

      <Marcadores praias={praias} aoEscolher={aoEscolher} />
    </MapContainer>
  );
}

// Distância mínima entre pinos na tela, para cada um ser fácil de tocar (WCAG 2.5.8).
const ESPACO_MINIMO_PX = 36;

/**
 * Mostra só os pinos que não encostam em outro já mostrado (as praias chegam da mais próxima para a mais
 * distante, então as mais relevantes ficam). Aproximar o mapa revela as demais; a lista tem todas.
 * O pino com balão aberto nunca some, mesmo se o mapa se mover para mostrar o balão.
 */
function Marcadores({ praias, aoEscolher }: { praias: Localidade[]; aoEscolher: (praia: Localidade) => void }) {
  const mapa = useMap();
  const [, redesenhar] = useState(0);
  const [idAberto, setIdAberto] = useState<number | null>(null);
  // Ao mudar o zoom, recalcula quais pinos cabem. O zoom é lido direto do mapa (não de um estado),
  // porque o setView da localização pode mudar o zoom sem passar por este componente.
  useMapEvents({ zoomend: () => redesenhar((n) => n + 1) });

  const zoom = mapa.getZoom();
  const escolhidos: Array<{ praia: Localidade; ponto: Point }> = [];
  const ponto = (p: Localidade) => mapa.project([p.latitude, p.longitude], zoom);
  const aberta = praias.find((p) => p.id === idAberto);
  if (aberta) escolhidos.push({ praia: aberta, ponto: ponto(aberta) });
  for (const praia of praias) {
    if (praia.id === idAberto) continue;
    const p = ponto(praia);
    if (escolhidos.every((e) => e.ponto.distanceTo(p) >= ESPACO_MINIMO_PX)) escolhidos.push({ praia, ponto: p });
  }
  const visiveis = escolhidos.map((e) => e.praia);

  return (
    <>
      {visiveis.map((praia) => (
        <Marker
          key={praia.id}
          position={[praia.latitude, praia.longitude]}
          icon={ICONE_PRAIA}
          keyboard
          eventHandlers={{
            add: (e) => {
              const elemento = (e.target as MarcadorLeaflet).getElement();
              elemento?.setAttribute("role", "button");
              elemento?.setAttribute("aria-label", `${praia.nome}: abrir detalhes`);
            },
            popupopen: () => setIdAberto(praia.id),
            popupclose: () => setIdAberto((atual) => (atual === praia.id ? null : atual)),
          }}
        >
          <Popup>
            <div className="space-y-2 font-sans">
              <p className="font-titulo text-base font-extrabold text-mares-titulo">{praia.nome}</p>
              {descreverLocal(praia) && <p className="m-0! text-sm text-mares-suave">{descreverLocal(praia)}</p>}
              <div className="flex flex-col gap-2">
                <button type="button" className="botao botao-primario" onClick={() => aoEscolher(praia)}>
                  Ver maré e clima
                </button>
                <BotaoFavorito localidade={praia} />
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
