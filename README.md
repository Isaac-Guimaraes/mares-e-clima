# Marés e Clima

Aplicativo web que mostra a previsão de marés, ondas e tempo de uma praia e indica os melhores horários para aproveitá-la. Usa apenas APIs públicas e gratuitas do [Open-Meteo](https://open-meteo.com/).

## Requisitos

- Node.js 22 ou superior (LTS)
- npm 10 ou superior

## Como rodar

```bash
npm install
npm run dev
```

- Front-end: porta 3000
- API: porta 3333 (verificação: `/api/saude`)

Opcional: copie `backend/.env.example` para `backend/.env` para mudar porta, CORS, cache ou país da busca, e `frontend/.env.example` para `frontend/.env.local` para mudar o endereço da API.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe API e front-end juntos |
| `npm test` | Roda os testes do back-end |
| `npm run typecheck` | Verifica os tipos dos dois projetos |
| `npm run lint` | Roda o ESLint no front-end |
| `npm run build` | Gera o build de produção |

## Estrutura

```
mares-e-clima/
├── backend/    API Express + TypeScript (model / service / controller)
├── frontend/   Interface em Next.js + React + Tailwind CSS, com as telas do protótipo e a identidade visual do manual
└── docs/       Entrega (React e Nielsen), endpoints do Open-Meteo e checklist de acessibilidade
```

## Telas

Início (`/`), Resultados da busca (`/busca`), Hoje (`/hoje`), Previsão (`/previsao`), Hora a hora (`/hora-a-hora`) e Ajustes (`/ajustes`).

## Entrega

- **Implementação em React** (rotas, estado, consumo de API, tratamento de erros e loading): `docs/implementacao-react.md`.
- **Usabilidade (Nielsen)**, no formato problemas → evidências → melhorias aplicadas: `docs/usabilidade-nielsen.md`.
- **APIs públicas no código:** procure por `[API PÚBLICA]` em `backend/src`.

## Fluxo

1. O usuário encontra a praia pelo nome (`GET /api/localidades`: praias do OpenStreetMap + Geocoding API), pela localização ou no mapa (`GET /api/praias`). A Marine API descarta lugares sem maré.
2. Ao escolher a praia → `GET /api/condicoes` → Marine API e Forecast API em paralelo.
3. O back-end une as séries pelo horário, detecta marés alta e baixa e marca as horas favoráveis.
4. O front-end exibe o gráfico de maré do dia (com tabela equivalente), os melhores horários, as condições de agora, a previsão diária e a hora a hora.

## Acessibilidade

Desenvolvido para atender às **WCAG 2.2, nível AA**, do W3C. Veja `docs/acessibilidade.md`.

## Aviso

Os dados de maré vêm de um modelo numérico com resolução de cerca de 8 km. **Não use para navegação.** Consulte as Tábuas de Marés da Marinha do Brasil.

## Licença dos dados

Dados meteorológicos e marinhos: Open-Meteo.com, licença CC BY 4.0, uso não comercial gratuito.

Mapa e base de praias: © colaboradores do OpenStreetMap, licença ODbL. Para atualizar a base (`backend/data/praias-osm.json`): `npm run praias:atualizar --workspace=backend`.
