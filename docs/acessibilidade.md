# Checklist de acessibilidade — WCAG 2.2 nível AA

Referência: [WCAG 2.2 (W3C)](https://www.w3.org/TR/WCAG22/) e [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/). Use esta lista em toda revisão de interface.

Legenda: ✅ implementado e verificado · 🔁 verificar a cada mudança

## 1. Perceptível

| Critério | Como o projeto atende | Onde |
| --- | --- | --- |
| 1.1.1 Conteúdo não textual | Gráfico com `role="img"`, `<title>`, `<desc>` resumindo os dados e tabela equivalente; ícones decorativos com `aria-hidden` ✅ | `GraficoMare.tsx`, `lib/condicoes.ts` (IconeTempo) |
| 1.3.1 Informações e relações | Landmarks, títulos h1→h3, `label`, `fieldset`/`legend`, tabelas com `caption` e `th scope` ✅ | `AppLayout.tsx`, `TabelaRolavel.tsx`, seções |
| 1.3.2 Sequência significativa | Ordem do DOM = ordem visual ✅ | — |
| 1.4.1 Uso de cor | Maré alta/baixa por forma + texto; "Favorável: Sim/Não" ✅ | gráfico, tabela hora a hora |
| 1.4.3 Contraste mínimo | Texto ≥ 4,5:1 nos dois temas (menor: 4,55:1 no claro, 5,98:1 no escuro) ✅ 🔁 | tokens em `globals.css` |
| 1.4.4 Redimensionar texto | Unidades `rem`; zoom liberado no viewport ✅ | `globals.css` |
| 1.4.10 Refluxo | Sem rolagem horizontal em 320 px; só tabelas e gráfico rolam ✅ 🔁 | `AppLayout.tsx`, `globals.css` |
| 1.4.11 Contraste não textual | Bordas de campos ≥ 3,2:1; foco ≥ 3,2:1 ✅ | `globals.css` |
| 1.4.12 Espaçamento de texto | `line-height` 1,5; sem alturas fixas em texto ✅ | `globals.css` |
| 1.4.13 Conteúdo em foco/hover | Sem tooltips; o gráfico mostra horários e tipos escritos e tem tabela equivalente ✅ | `GraficoMare.tsx` |

## 2. Operável

| Critério | Como o projeto atende | Onde |
| --- | --- | --- |
| 2.1.1 Teclado | Só `button`, `a`, `input`, `select` nativos; regiões roláveis com `tabIndex={0}` ✅ | componentes |
| 2.1.2 Sem armadilha de teclado | Sem modais ✅ | — |
| 2.4.1 Ignorar blocos | Link "Pular para o conteúdo" ✅ | `AppLayout.tsx` |
| 2.4.2 Título da página | Um título por rota ("Hoje · Marés e Clima") ✅ | `app/(app)/*/page.tsx` |
| 2.4.3 Ordem do foco | Foco vai ao h1 de Hoje após escolher a praia e a "Desfazer" ao remover uma favorita ✅ | `PaginaHoje.tsx`, `PaginaInicio.tsx` |
| 2.4.6 Cabeçalhos e rótulos | Títulos descritivos por seção ✅ | — |
| 2.4.7 Foco visível | Contorno de 3 px com afastamento ✅ | `globals.css` |
| 2.4.11 Foco não encoberto (novo na 2.2) | Cabeçalho não fixo; `scroll-padding-top` ✅ | `AppLayout.tsx`, `globals.css` |
| 2.5.3 Rótulo no nome | Nome acessível começa pelo texto visível ("Favorita: Itapuã") ✅ | `ListaLocais.tsx` |
| 2.5.8 Tamanho do alvo (novo na 2.2) | Botões de 48 px (manual) e alvos de no mínimo 44 px; rádios dentro de rótulos clicáveis de 44 px ✅ | `globals.css` |
| 2.3.3 Animação por interação | `prefers-reduced-motion`; gráfico sem animação ✅ | `globals.css`, `GraficoMare.tsx` |

## 3. Compreensível

| Critério | Como o projeto atende | Onde |
| --- | --- | --- |
| 3.1.1 Idioma da página | `lang="pt-BR"` ✅ | `app/layout.tsx` |
| 3.1.2 Idioma das partes | Termo em inglês marcado com `lang="en"` ✅ | rodapé |
| 3.2.1 / 3.2.2 Em foco / em entrada | Preferências só se aplicam ao clicar em "Salvar", sem mover o foco nem trocar de página ✅ | `PaginaAjustes.tsx` |
| 3.3.1 Identificação de erro | Mensagem em texto, `aria-invalid`, anunciada na região de status ✅ | `CampoBusca.tsx` |
| 3.3.2 Rótulos ou instruções | Rótulos visíveis e dicas com exemplo ✅ | componentes |
| 3.3.3 Sugestão de erro | "Digite pelo menos 3 letras…", "Confira a grafia…" ✅ | `CampoBusca.tsx` |

## 4. Robusto

| Critério | Como o projeto atende | Onde |
| --- | --- | --- |
| 4.1.2 Nome, função, valor | Favoritar muda o texto ("Favoritar"/"Favoritada"); menu com `aria-expanded`; abas de dia no padrão Tabs do WAI-ARIA ✅ | `ListaLocais.tsx`, `AppLayout.tsx`, `SeletorDia.tsx` |
| 4.1.3 Mensagens de status | `role="status"` + `aria-live="polite"`; `aria-busy` durante a carga ✅ | `AppLayout.tsx`, `PraiaProvider.tsx` |

## Como testar

1. **Teclado**: navegue a página inteira só com Tab, Shift+Tab, Enter e Espaço.
2. **Leitor de tela**: NVDA (Windows, gratuito) ou Narrador; confira os anúncios de status.
3. **Zoom 200% e 400%** no navegador; e largura de 320 px nas ferramentas de desenvolvedor.
4. **Automático**: Lighthouse (Chrome DevTools → Lighthouse → Acessibilidade) ou a extensão axe DevTools.
5. **Contraste**: ao mudar uma cor, confira em https://webaim.org/resources/contrastchecker/.
6. **Modo de alto contraste do Windows** (`forced-colors`).
