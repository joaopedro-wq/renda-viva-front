# Renda Viva — Próximas features

Roadmap único do produto — atravessa `renda-viva-front` e `renda-viva-back` (repos irmãos, mesma
pasta pai). Cada fase é pequena e testável ponta a ponta contra o backend real, mesmo espírito do
Vitality PLUS. Marque ✅ ao terminar uma fase; mantenha a ordem — cada uma assume a anterior pronta.

## Feito

- ✅ **Fase 0 — Scaffold**: auth (login/registro/logout) ponta a ponta, `bandeira-shell` integrado
  (tema "Calmo", um item de menu), dashboard em placeholder estático. Ver `CLAUDE.md`.
- ✅ **Fase 1 — Schema**: 5 tabelas (`rendas`, `gastos`, `categorias_gasto`, `obrigacoes_fixas`,
  `movimentos_colchao`), models com `scopeDoUsuario`, seeder de categorias. Ver `CLAUDE.md` do
  backend pra detalhe de cada coluna.
- ✅ **Fase 2 — Backend: CRUD de lançamentos**: `RendaController`, `GastoController`,
  `ObrigacaoFixaController` — REST padrão, escopados, com Form Request/Resource por ação.
  `GastoController@index` aceita `?mes=YYYY-MM`. Ver contrato de rotas no `CLAUDE.md` do backend.
- ✅ **Fase 3 — Backend: `SafeToSpendService`**: `GET /api/painel/dado-da-semana` implementado.
  Modo prudente (nunca projeta renda futura), colchão exposto à parte, nunca somado ao cálculo.
- ✅ **Fase 4 — Backend: Colchão (fechamento mensal automático)**: `CushionService::fecharMes()` +
  `php artisan colchao:fechar-mes` (agendado dia 1, 00:10, `America/Sao_Paulo`). Parâmetros
  validados: linha de base = média simples dos 3 meses anteriores ao mês fechado; aporte/saque =
  20% do excedente/déficit. Sem histórico, não faz nada. Saque nunca deixa saldo negativo.

- ✅ **Fase 5 — Frontend: telas de lançamento**: `features/rendas/`, `features/gastos/`,
  `features/obrigacoes/` — formulário + lista com edição/exclusão, `*.service.ts` por recurso em
  `features/*/data/`. Endpoint novo `GET /api/categorias-gasto` (catálogo global) criado no
  backend pra alimentar o select de categoria em `gastos`; `CategoriaGastoService` mora em
  `core/catalog/` (cacheado em memória, é catálogo compartilhado). Rotas e itens de menu
  registrados em `app.routes.ts`/`shell-nav.config.ts`.

- ✅ **Fase 6 — Frontend: Dashboard real**: `dashboard.component.html` consome
  `GET /api/painel/dado-da-semana` via `features/dashboard/data/painel.service.ts`. Valor seguro
  da semana, renda/semanas restantes e saldo do colchão agora são reais. `bandeira-ui` não tem um
  componente tipo "reservatório" (a referência do `plate-loader` era do Vitality PLUS, projeto
  fora deste workspace) — a barra do colchão ficou binária (tem/não tem saldo), já que ainda não
  existe uma "meta" de colchão por usuário pra calcular um percentual real (ver Stretch). Revisitar
  quando a Fase de metas concretas entrar.

- ✅ **Fase 7 — Frontend: "sua história do mês"**: `HistoriaDoMesService` (`features/dashboard/
data/`) monta 3 frases fixas preenchidas por dado real — resumo (renda x gasto), categoria que
  mais pesou (agregado client-side sobre `GET /api/gastos?mes=`) e movimento do colchão (mês
  atual). Exigiu endpoint novo no backend: `GET /api/movimentos-colchao` (só leitura, escopado,
  aceita `?mes=YYYY-MM`) — não existia até aqui, só o `CushionService` criava registros. IA
  generativa segue como upgrade futuro, não implementada.

## Em aberto

Nenhuma fase pendente no momento — próximo trabalho vem do Stretch abaixo ou de nova demanda.

## Stretch (sem data, avaliar quando chegar)

- **Metas concretas com recompensa visível** (ver ideação inicial do produto) — provavelmente
  reaproveita `MetaRevealComponent`/`journey-map` do Vitality PLUS como referência visual.
  Precisaria de uma tabela `metas` (`usuario_id, titulo, valor_alvo, valor_atual, data_alvo,
icone`) — ainda não desenhada em detalhe.
- Categorias de gasto por usuário (hoje são globais/seedadas) — só se a demanda de personalização
  aparecer de verdade.
- Renda por fonte normalizada (`income_sources`) — hoje `rendas.fonte` é string livre; normalizar
  só se precisar agregar/analisar por cliente/fonte.
