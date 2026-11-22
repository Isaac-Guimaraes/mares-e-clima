# Usabilidade: as 10 heurísticas de Nielsen aplicadas

Este documento registra, para cada heurística de Jakob Nielsen, um **problema** encontrado no Marés e Clima, a **evidência** que mostrou o problema e a **melhoria aplicada**, com o arquivo onde ela está. No código, as melhorias estão marcadas com comentários `Heurística N de Nielsen`.

## Como avaliamos

- **Avaliação heurística** das versões anteriores do front-end (tela única) comparadas com o protótipo web e o Manual de Identidade Visual.
- **Uso real da busca** com nomes de praias brasileiras (Itapuã, Copacabana, Ipanema, Pipa, Praia do Forte, Jericoacoara, Porto de Galinhas, Maragogi).
- **Testes automatizados no navegador** (Playwright no Chrome) que percorrem todas as rotas em 1440 px, 1280 px (tema escuro) e 320 px, incluindo queda de rede simulada, e rodam o axe-core (WCAG 2.2 AA) em cada tela: **0 violações**.

## Resumo

| # | Heurística | Problema | Melhoria aplicada |
| --- | --- | --- | --- |
| 1 | Visibilidade do status do sistema | Não se sabia se os dados eram recentes nem se uma consulta estava em andamento | "Atualizado há X min", esqueleto de carregamento, aviso "Atualizando…", rota atual destacada |
| 2 | Correspondência com o mundo real | A busca conhecia cidades e bairros, não praias; datas longas e termos técnicos | Base de praias do OpenStreetMap; busca sem o prefixo "Praia de"; "Hoje / Amanhã / Qui"; "maré enchendo / vazando" |
| 3 | Controle e liberdade do usuário | Remover uma favorita era definitivo; não havia como limpar a busca | "Desfazer"; botão ✕ na busca; "Restaurar padrão" em Ajustes |
| 4 | Consistência e padrões | Tela única diferente do protótipo e cores fora do manual | 5 rotas do protótipo, paleta e componentes do manual, mesmo estado de carga/erro em todas as telas |
| 5 | Prevenção de erros | Buscar "it" gastava uma consulta e não achava nada; cidades do interior apareciam | Mínimo de 3 letras antes de consultar; filtro de litoral; opções segmentadas; limites corrigidos com aviso |
| 6 | Reconhecer em vez de lembrar | O usuário precisava lembrar os critérios e a última praia | Critérios à vista em "Melhores horários"; "Continuar com…"; favoritas no Início |
| 7 | Flexibilidade e eficiência | Quem não sabia o nome da praia não tinha como achá-la | "Usar minha localização", mapa com as praias da região, atalhos "Alterar critérios", busca na URL |
| 8 | Estética e design minimalista | Uma tela com 6 seções e tabela de 72+ linhas | Uma tarefa por rota; hora a hora por dia (24 linhas); proporção de cores do manual |
| 9 | Reconhecer, diagnosticar e recuperar erros | "Nenhuma praia encontrada" sem dizer o que fazer; falha de rede sem saída | Dicas concretas; "Tentar novamente" mantendo os dados anteriores; tela de erro e 404 com caminho de volta |
| 10 | Ajuda e documentação | Gráfico e recomendação sem explicação | "Como funciona"; legenda do gráfico; coluna "Por quê" no hora a hora; avisos curtos |

## Detalhamento

### 1. Visibilidade do status do sistema

- **Problema:** os dados ficam em cache por até 60 minutos (RNF01), mas a tela não dizia de quando eram. Ao trocar de praia ou de critério, a tela anterior continuava igual até a resposta chegar, sem indicar que algo estava acontecendo.
- **Evidência:** na versão de tela única, ao salvar preferências, a única pista de carregamento era uma frase na região de status, fácil de não ver. O protótipo não previa estado de carregamento.
- **Melhorias:**
  - "Atualizado há X min · Fonte: Open-Meteo" no topo da tela Hoje (`components/paginas/PaginaHoje.tsx`, `lib/formatacao.ts → tempoDesde`).
  - Esqueleto de carregamento com o nome da praia ("Carregando maré e clima de Itapuã…") e aviso "Atualizando…" quando já há dados na tela (`components/EstadoPraia.tsx`).
  - Rota atual sublinhada e marcada com `aria-current` (`components/AppLayout.tsx`).
  - "Você tem alterações não salvas" em Ajustes (`components/paginas/PaginaAjustes.tsx`).
  - Linha "Agora 19:51" no gráfico e a palavra "agora" na linha da hora atual da tabela.

### 2. Correspondência entre o sistema e o mundo real

- **Problema:** as pessoas pensam em nomes de praia ("Praia do Buracão", "Praia de Ipanema"), mas a Geocoding API do Open-Meteo usa a base GeoNames, que tem cidades e bairros e quase nenhuma praia. Datas apareciam como "sábado, 21 de novembro", e a API fala em `sea_level_height_msl`.
- **Evidência:** relato de uso em 21/11/2026: "o campo de busca não está sendo preciso". A consulta `name=Praia de Ipanema` devolvia lista vazia, enquanto `name=Ipanema` devolvia o bairro (teste de 09/11/2026). No OpenStreetMap, só a área de Salvador tem 37 praias com nome, como Buracão, Piatã e Boa Viagem.
- **Melhorias:**
  - Base local com as praias com nome do litoral brasileiro, extraída do OpenStreetMap. A busca mostra essas praias primeiro e depois cidades e bairros, sem repetir o mesmo lugar (`backend/src/services/praias.service.ts`, `geocoding.service.ts`).
  - Se o nome completo não encontra nada na Geocoding API, a busca tenta de novo sem "Praia de/do/da".
  - Abas de dia "Hoje", "Amanhã", "Qui" (`lib/formatacao.ts → rotuloDia`, `components/SeletorDia.tsx`).
  - "Maré agora: Enchendo · -0,19 m" e "Próxima: maré alta às 00:00", em vez de números soltos (`PaginaHoje.tsx`).
  - Ícone do tempo a partir do código WMO, sempre ao lado da descrição em texto (`lib/condicoes.ts → IconeTempo`).
  - Janelas descritas em linguagem de praia: "maré vazando · ondas até 0,8 m" (`lib/condicoes.ts → resumirJanela`).

### 3. Controle e liberdade do usuário

- **Problema:** um toque em "Favoritada" removia a praia sem volta. A busca não tinha como ser limpa num toque, e não havia como voltar aos critérios originais.
- **Evidência:** o protótipo mostra o botão ✕ no campo de busca; na versão anterior, remover uma favorita sem querer obrigava a buscar a praia de novo.
- **Melhorias:**
  - "Itapuã foi removida das favoritas. **Desfazer**", com o foco indo direto para "Desfazer" (`PraiaProvider.tsx → desfazerRemocaoFavorita`, `PaginaInicio.tsx`).
  - Botão ✕ "Limpar busca" (`components/CampoBusca.tsx`).
  - "Restaurar padrão" em Ajustes, que só vale depois de salvar (`PaginaAjustes.tsx`).

### 4. Consistência e padrões

- **Problema:** a versão anterior era uma tela única com a paleta de outro projeto (âmbar e ciano), diferente do protótipo de 5 telas e do Manual de Identidade Visual.
- **Evidência:** comparação lado a lado com o protótipo (Início, Hoje, Previsão, Hora a hora, Ajustes) e com as páginas 6, 7 e 10 do manual.
- **Melhorias:**
  - As 5 rotas do protótipo, com a busca no cabeçalho de todas elas (`app/(app)/*`, `AppLayout.tsx`).
  - Tokens de cor do manual (Oceano, Maré, Água, Sol, Areia, Tinta, Névoa e cores funcionais), fontes Nunito e Inter, ícones Lucide, botões de 48 px e raio 14 px, cards de raio 20 px sem sombra (`app/globals.css`).
  - Um único componente de carregamento, erro e "sem praia" usado por Hoje, Previsão e Hora a hora (`EstadoPraia.tsx`).
  - Os mesmos chips Favorável / Atenção / Desfavorável em todas as telas, sempre com ícone e texto (`components/Avisos.tsx → Chip`).

### 5. Prevenção de erros

- **Problema:** buscar com 2 letras gastava uma consulta e não achava nada. Cidades do interior com o mesmo nome apareciam como se fossem praias. Os campos numéricos aceitavam valores fora dos limites da API.
- **Evidência:** a busca por "it" mostrou "Nenhuma praia encontrada para 'it'" (captura de tela de 09/11/2026); a API só aceita nome exato com 2 letras. A busca por "Copacabana" trazia Copacabana (MT), no interior.
- **Melhorias:**
  - Validação de 3 letras antes de consultar, com mensagem ligada ao campo (`CampoBusca.tsx`).
  - Filtro de litoral: o back-end consulta a Marine API e descarta locais sem dados de maré (`backend/src/services/marine.service.ts → filtrarComMare`).
  - Dias, maré e tema como opções segmentadas, que só permitem valores válidos (`components/GrupoOpcoes.tsx`).
  - Chuva e vento fora da faixa são ajustados e o usuário é avisado: "Vento ajustado para 150 km/h" (`PaginaAjustes.tsx`).

### 6. Reconhecer em vez de lembrar

- **Problema:** para entender por que um horário era recomendado, o usuário precisava lembrar os critérios configurados em outra tela. A última praia consultada não aparecia no início.
- **Evidência:** na versão anterior os critérios só apareciam no formulário de preferências.
- **Melhorias:**
  - "Seus critérios: luz do dia, chuva até 30%, vento até 25 km/h" no card "Melhores horários" (`PaginaHoje.tsx`).
  - "Continuar com Copacabana" e as favoritas no Início (`PaginaInicio.tsx`).
  - A praia escolhida fica salva e reabre em qualquer rota (`lib/preferencias.ts → lerPraiaAtual`).

### 7. Flexibilidade e eficiência de uso

- **Problema:** a única forma de achar uma praia era saber o nome dela, e quem queria ajustar a recomendação precisava descobrir onde ficavam os critérios.
- **Evidência:** pedido de uso em 21/11/2026: encontrar "praias perto da sua localização atual" ou "um mapa onde podemos selecionar as praias".
- **Melhorias:**
  - "Praias perto de mim" no Início e "Usar minha localização" na busca: o mapa vai até o usuário e a lista ordena as praias pela distância, "a 2,3 km de você" (`PaginaBusca.tsx`).
  - Mapa com as praias da área visível como marcadores, com "Ver maré e clima" e "Favoritar" no balão de cada uma (`components/MapaPraias.tsx`). A lista ao lado tem as mesmas praias, para quem usa teclado ou leitor de tela.
  - Para não travar o mapa, as praias vêm de uma base local: a Overpass API levou de 30 a 40 s por consulta nos testes de 21/11/2026.
  - Atalhos "Alterar critérios" (Hoje) e "Ajuste suas preferências" (Previsão).
  - O termo buscado fica na URL (`/busca?q=Itapuã`): dá para voltar, recarregar e compartilhar (`PaginaBusca.tsx`).
  - Abas de dia operáveis pelas setas, Home e End, no padrão do WAI-ARIA (`SeletorDia.tsx`).
  - Favoritas abrem a tela Hoje com um toque.

### 8. Estética e design minimalista

- **Problema:** a tela única reunia busca, favoritas, preferências, condições, gráfico, previsão diária e uma tabela de 72 a 168 linhas, gerando uma página com mais de 2.800 px de altura.
- **Evidência:** captura da tela única em 1920 px (09/11/2026).
- **Melhorias:**
  - Uma tarefa principal por rota, como no protótipo.
  - Hora a hora mostra um dia por vez (24 linhas).
  - Proporção de cores do manual: Areia como fundo, Oceano nas barras, e Sol reservado ao que o usuário mais procura, o melhor horário.

### 9. Ajudar a reconhecer, diagnosticar e recuperar erros

- **Problema:** "Nenhuma praia encontrada" não dizia o que tentar. Uma falha de rede deixava a tela sem saída.
- **Evidência:** a mensagem da captura de 09/11/2026; teste automatizado que derruba `GET /api/condicoes` e verifica a tela.
- **Melhorias:**
  - Busca vazia com dicas concretas: conferir a grafia, tentar o nome da cidade, não precisar de "Praia de" (`PaginaBusca.tsx`).
  - Falha de rede: "Não conseguimos carregar os dados. Confira sua internet e tente de novo." com botão **Tentar novamente**, e os dados anteriores continuam visíveis (`EstadoPraia.tsx`, `PraiaProvider.tsx → tentarNovamente`).
  - Erro inesperado numa tela não derruba o app: `app/(app)/error.tsx`. Endereço inexistente: `app/not-found.tsx`. Ambos com "Voltar ao início".
  - Mensagens do back-end já chegam em português (`{ erro: { mensagem } }`, RNF06).

### 10. Ajuda e documentação

- **Problema:** o gráfico tinha faixas e símbolos sem explicação. "Favorável: Não" não dizia o motivo.
- **Melhorias:**
  - "Como funciona" em 3 passos no Início (`PaginaInicio.tsx`).
  - Legenda em texto do gráfico: nível do mar, ▲ ▽, melhor horário, noite e a referência da altura (`components/GraficoMare.tsx`).
  - Coluna "Por quê" no Hora a hora: "Chance de chuva de 48%", "Fora do período de luz do dia" (`PaginaHoraAHora.tsx`).
  - Avisos curtos na busca ("Mostramos só lugares do litoral…") e em Ajustes (como a recomendação funciona).
