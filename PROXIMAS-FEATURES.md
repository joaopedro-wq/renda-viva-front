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
- ✅ **Fase 8 — Importação de extrato bancário**: motivação — lançar cada renda/gasto manualmente
  todo mês é a mesma fricção de uma planilha; o app só cumpre a promessa de facilitar a vida do
  usuário se conseguir importar o extrato do banco em vez de digitar linha por linha. Ponto de
  partida: extrato de **conta** do Nubank (`Data,Valor,Identificador,Descrição`, `Identificador` é
  um UUID estável por transação).

  **Import nunca grava direto** — mesmo espírito do "modo prudente": sugere, usuário revisa e
  confirma, só então grava. Nenhuma linha de extrato vira `renda`/`gasto` sem passar pela tela de
  revisão.

  Decisões validadas com o usuário (não redecidir):
  - **Formato configurável desde a v1** (não só Nubank hardcoded): `modelos_importacao`
    (`usuario_id, nome, assinatura_colunas, coluna_data, coluna_valor, coluna_descricao,
    coluna_identificador nullable, formato_data, convencao_sinal`) guarda o mapeamento de colunas
    por formato de banco, reconhecido automaticamente pelo cabeçalho do CSV nas próximas
    importações — sem remapear todo mês.
  - **Dedupe via identificador externo**: `rendas`/`gastos` ganham `origem_externa_id` (nullable,
    unique por usuário). Reimportar o mesmo arquivo ou um mês sobreposto pula linhas já importadas
    automaticamente — idempotente, mesmo padrão do `CategoriaGastoSeeder`.
  - **"Pagamento de fatura" (cartão de crédito) importa como gasto avulso**, sem categoria
    específica — não tenta decompor em compras individuais.
  - **Todo Pix recebido de pessoa física entra como candidato a `renda` por padrão** — usuário
    descarta manualmente na revisão se for divisão de conta/devolução/etc. Prioriza não perder
    renda real sobre poluir menos o cálculo.
  - **Par "lavado" é detectado e a perna de entrada é ignorada por padrão**: mesmo
    `Identificador`/`origem_externa_id` aparecendo em duas linhas com valores opostos (ex.: Nubank
    "Valor adicionado por cartão de crédito" seguido do Pix que consumiu esse valor) — sem isso,
    vira renda fantasma duplicando o gasto real.

  Backend: `ExtratoParserService` (parseia CSV cru → linhas normalizadas, aceita `1234.56` e
  `1.234,56`) + `ClassificacaoImportService` (heurísticas de sugestão, puro, sem gravar nada) +
  `POST /api/importacoes/pre-visualizar` (preview classificado, nada gravado) +
  `POST /api/importacoes/confirmar` (grava em lote) + `GET /api/modelos-importacao`. Tudo testado
  ponta a ponta contra um extrato real do Nubank — achou e corrigiu 2 bugs reais nesse processo:
  falso positivo de categoria ("MERCADO" batendo em "MERCADO PAGO") e um bug estrutural
  pré-existente na API inteira (rota protegida sem `Accept: application/json` crashava com 500 em
  vez de 401 — corrigido em `bootstrap/app.php`, ver `CLAUDE.md` do backend). 75 testes no backend.

  Frontend: `features/importacao/` — upload → mapeamento de colunas (só se não reconhecer o
  cabeçalho, com chute inicial por nome de coluna) → tabela de revisão editável (tipo, categoria,
  incluir/ignorar linha, com badge pra par lavado/já importado) → confirmação → resumo (X
  rendas/Y gastos criados, Z já existiam).

  **Ajuste feito depois de testar na tela** (não redecidir sem necessidade real): o formato Nubank
  Conta (`Data,Valor,Identificador,Descrição`) é reconhecido automaticamente no backend
  (`ImportacaoController::mapeamentoNubankSeReconhecido`), sem passar pela tela de mapeamento
  manual — é o formato de referência validado nesta sessão. Outros formatos ainda caem no
  mapeamento manual.
  - **Bug real de `bandeira-ui` encontrado e corrigido**: `BdInputComponent` (`bdInput`) tem
    `template: ''` sem `<ng-content>` — funciona em `<input>`/`<textarea>` (sem filhos), mas em
    `<select bdInput>` o Angular descarta as `<option>` projetadas, deixando o select sem nenhuma
    opção pra abrir. Nunca usar `bdInput` em `<select>` — usar a classe `select-nativo`
    (`styles.scss`), que replica o visual sem depender do componente quebrado. Todo `<select>` do
    app já foi migrado.

- ✅ **Categorização de renda**: `categorias_renda` (catálogo global, mesmo padrão de
  `categorias_gasto` — nome/ícone/cor, seedado com Salário/Freelance/Vendas/Comissão/
  Investimentos/Outros) + `rendas.categoria_renda_id` (opcional). Tela de rendas ganhou o select de
  categoria. **A importação "aprende"**: `ClassificacaoImportService` sugere a categoria de uma
  renda pela descrição exata do extrato — se esse usuário já categorizou uma renda com a mesma
  descrição antes (o mesmo pagador tende a repetir a descrição todo mês: salário, cliente fixo de
  freela), a sugestão do próximo mês já vem pronta, sem precisar recategorizar. Sem heurística de
  palavra-chave pra renda (diferente de gasto) — não dá pra adivinhar "isso é salário" só pelo
  texto, só pelo histórico. Endpoint novo: `GET /api/categorias-renda`.

## Em aberto

- **Proposta: Fase 9 — Sincronização automática via Open Finance (substitui upload manual de CSV)**.
  Motivação: a Fase 8 já resolve importação, mas exige o usuário exportar/subir o CSV do Nubank à
  mão todo mês — o próximo nível de fricção a remover é puxar o extrato automaticamente.

  **Descoberta importante desta sessão**: não existe "API do Nubank" pública pra terceiros lerem
  dados de um usuário. Só dá pra fazer isso via **Open Finance Brasil** (regulado pelo Bacen), e
  virar participante direto do Open Finance é inviável pra um app deste porte (certificação
  ICP-Brasil, homologação no diretório de participantes). Caminho realista: um **agregador/TPP já
  certificado** que faz essa ponte — candidato principal **Pluggy** (foco em fintechs BR, sandbox
  de dev), alternativas Belvo/Quanto/Klavi. Nunca pedir senha do banco no app nem fazer
  screen-scraping — o fluxo é sempre consentimento OAuth-like no próprio app/site do banco.

  Decisões de arquitetura assumidas (a validar antes de implementar):
  - **Toda a integração mora no backend** (Laravel) — chave de API do agregador, item de conexão
    por usuário, job de sincronização periódica. O Angular nunca vê credencial nem token de
    consentimento; só abre o widget de conexão do agregador (ex. Pluggy Connect) e depois consome
    endpoints próprios (`GET /api/conexoes-bancarias`, etc. — nomes a definir).
  - **Reaproveita o funil da Fase 8** (`ClassificacaoImportService` + tela de revisão em
    `features/importacao/`): a sincronização automática vira só uma fonte alternativa de linhas
    normalizadas, entrando no mesmo "sugere → usuário revisa e confirma → grava" — nunca grava
    direto, mesmo espírito do "modo prudente" do resto do app.
  - **Dedupe reaproveita `origem_externa_id`** (já existe em `rendas`/`gastos` desde a Fase 8) —
    o identificador de transação do agregador vira esse campo, sem precisar de coluna nova.

  Em aberto pra decidir antes de começar (não assumir, perguntar ao usuário quando chegar a vez):
  - Qual agregador de fato (custo por conexão ativa muda a viabilidade — confirmar tabela de preço
    da Pluggy antes de comprometer).
  - Escopo do MVP: só conta do Nubank, ou já desenhar pra multi-banco (a base de
    `modelos_importacao` da Fase 8 já é multi-formato, mas conexão via agregador é um conceito
    novo, não é só "mais um formato de CSV").
  - Frequência de sync (webhook do agregador vs. polling agendado) e o que fazer se o consentimento
    expirar/for revogado pelo usuário no banco.

  Próximo trabalho vem daqui, do Stretch abaixo, ou de nova demanda.

## Stretch (sem data, avaliar quando chegar)

- **Metas concretas com recompensa visível** (ver ideação inicial do produto) — provavelmente
  reaproveita `MetaRevealComponent`/`journey-map` do Vitality PLUS como referência visual.
  Precisaria de uma tabela `metas` (`usuario_id, titulo, valor_alvo, valor_atual, data_alvo,
  icone`) — ainda não desenhada em detalhe.
- Categorias de gasto por usuário (hoje são globais/seedadas) — só se a demanda de personalização
  aparecer de verdade.
- Renda por fonte normalizada (`income_sources`) — hoje `rendas.fonte` é string livre; normalizar
  só se precisar agregar/analisar por cliente/fonte.
- Suporte a outros formatos de extrato além do Nubank (a arquitetura de `modelos_importacao` já
  suporta, só falta um segundo banco real pra validar o fluxo de mapeamento manual na prática).
- Sugerir `obrigacoes_fixas` a partir de padrões recorrentes no extrato importado (mesmo valor/
  descrição repetindo todo mês) — nunca criar automático, só sugerir.
