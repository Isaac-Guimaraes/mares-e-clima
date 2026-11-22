# Implementação em React

Mapa de onde cada item da entrega está no código do front-end (`frontend/src`). Stack: Next.js 16 (App Router), React 19, TypeScript e Tailwind CSS v4.

## Rotas

As rotas seguem o protótipo web. Cada arquivo `page.tsx` define o título da aba e renderiza um componente de `components/paginas`.

| Rota | Tela | Arquivo da rota | Componente |
| --- | --- | --- | --- |
| `/` | Início | `app/(app)/page.tsx` | `PaginaInicio.tsx` |
| `/busca?q=` `/busca?perto=1` | Busca por nome, pela localização e no mapa | `app/(app)/busca/page.tsx` | `PaginaBusca.tsx`, `MapaPraias.tsx` |
| `/hoje` | Hoje (gráfico de maré, melhores horários, agora) | `app/(app)/hoje/page.tsx` | `PaginaHoje.tsx` |
| `/previsao` | Previsão diária | `app/(app)/previsao/page.tsx` | `PaginaPrevisao.tsx` |
| `/hora-a-hora` | Hora a hora | `app/(app)/hora-a-hora/page.tsx` | `PaginaHoraAHora.tsx` |
| `/ajustes` | Preferências | `app/(app)/ajustes/page.tsx` | `PaginaAjustes.tsx` |
| qualquer outra | Página não encontrada | `app/not-found.tsx` | — |

- O layout compartilhado (`app/(app)/layout.tsx`) envolve todas as rotas com o estado global e o `AppLayout` (cabeçalho com navegação e busca, rodapé).
- Navegação com `<Link>` do Next.js e `useRouter().push()` (busca → `/busca`, escolher praia → `/hoje`).
- `/dashboard`, da versão anterior, redireciona para `/hoje` (`next.config.ts`).

## Estado

- **Estado global** com React Context: `components/PraiaProvider.tsx` guarda a praia consultada, as condições, o carregamento, o erro, as favoritas e as preferências. Como fica no layout, o estado sobrevive à troca de rota. As telas leem com o hook `usePraia()`.
- **Estado local** com `useState` em cada tela: aba de dia selecionada (`PaginaHoje`, `PaginaHoraAHora`), campos do formulário (`PaginaAjustes`), resultado da busca (`PaginaBusca`).
- **Estado na URL:** o termo da busca (`useSearchParams`).
- **Persistência** no `localStorage`: favoritas, preferências, tema e última praia (`lib/preferencias.ts`, RF09). Toda leitura é protegida para funcionar em modo privado.

## Consumo de API

- O navegador chama o back-end do projeto: `lib/api.ts` (`buscarLocalidades` → `GET /api/localidades`, `buscarPraiasNaArea` → `GET /api/praias`, `obterCondicoes` → `GET /api/condicoes`).
- O navegador também usa duas interfaces públicas diretamente: a **Geolocation API** do próprio navegador ("Usar minha localização", `PaginaBusca.tsx`) e os blocos de mapa do **OpenStreetMap** (`MapaPraias.tsx`).
- Praias por nome e por área vêm de uma base local do OpenStreetMap (`backend/data/praias-osm.json`), extraída da **Overpass API** do OpenStreetMap em 21/11/2026 (praias com `natural=beach` e nome nos 17 estados litorâneos).
- O back-end chama as APIs públicas do Open-Meteo. Cada ponto está marcado com o comentário `[API PÚBLICA]`:

| API pública | Endpoint | Onde é chamada |
| --- | --- | --- |
| Geocoding API | `https://geocoding-api.open-meteo.com/v1/search` | `backend/src/services/geocoding.service.ts` (`buscarNoLitoral`) |
| Marine Weather API | `https://marine-api.open-meteo.com/v1/marine` | `backend/src/services/marine.service.ts` (`obterPrevisao` e `filtrarComMare`) |
| Weather Forecast API | `https://api.open-meteo.com/v1/forecast` | `backend/src/services/forecast.service.ts` (`obterPrevisao`) |
| (todas) | `fetch` único com tempo limite | `backend/src/clients/open-meteo.client.ts` |
| (todas) | endereços configurados | `backend/src/config/env.ts` |

- Requisições antigas são canceladas com `AbortController` quando o usuário faz outra consulta (`PraiaProvider.tsx`, `PaginaBusca.tsx`).

## Tratamento de erros

- `lib/api.ts`: falha de rede e respostas HTTP de erro viram `ErroApi`, com mensagem em português pronta para a tela; `mensagemDeErro` ignora consultas canceladas.
- `components/Avisos.tsx → AvisoErro`: mensagem com ícone e botão **Tentar novamente**.
- `components/EstadoPraia.tsx`: se uma nova consulta falha, os dados anteriores continuam na tela, com o aviso acima.
- `app/(app)/error.tsx`: *error boundary* do Next.js. Um erro inesperado numa tela não derruba o cabeçalho nem a navegação.
- `app/not-found.tsx`: endereço inexistente.
- Localização: permissão negada, indisponível ou demorada geram mensagens diferentes, com "Tentar novamente" e a sugestão de usar o mapa (`PaginaBusca.tsx`).
- Validação antes de consultar: busca com menos de 3 letras (`CampoBusca.tsx`) e limites de chuva e vento (`PaginaAjustes.tsx`).

## Loading

- `PraiaProvider.tsx → carregandoPraia`: indica qual praia está carregando.
- `components/EstadoPraia.tsx`: esqueleto de carregamento quando ainda não há dados, e "Atualizando…" quando há; `aria-busy` na região.
- `PaginaBusca.tsx`: carregamento derivado do estado ("a resposta guardada é desta busca?"), com esqueleto, para a busca por nome e para as praias da área do mapa; "Localizando…" enquanto o navegador busca a posição.
- O mapa é carregado sob demanda (`next/dynamic`), com um espaço do mesmo tamanho enquanto chega.
- `app/(app)/loading.tsx`: carregamento de rota do Next.js.
- `app/(app)/busca/page.tsx`: `<Suspense>` enquanto o termo é lido da URL.
- Todas as mudanças são anunciadas para leitores de tela pela região `role="status"` do `AppLayout`.
