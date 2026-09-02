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

## Em aberto

### Fase 2 — Backend: CRUD de lançamentos

`RendaController`, `GastoController`, `ObrigacaoFixaController` — REST padrão (`index/store/update/
destroy`), cada um:

- Escopado por `scopeDoUsuario(auth()->id())` — nenhuma listagem sem esse filtro.
- Form Request próprio por ação (`StoreRendaRequest`, etc.) — nunca validar inline no controller.
- API Resource pra resposta (`RendaResource`, `GastoResource`, `ObrigacaoFixaResource`).
- Rotas em `routes/api.php`, dentro do grupo `auth:sanctum` (ver padrão em `CLAUDE.md`).

`GastoController@index` precisa aceitar filtro por período (`?mes=2026-09`) — a tela de "história
do mês" e o cálculo semanal vão precisar disso.

### Fase 3 — Backend: `SafeToSpendService` (o cálculo central)

O número que carrega o produto: "quanto dá pra gastar essa semana". Service dedicado (não met6odo
solto no controller), algo como:

```php
class SafeToSpendService
{
    public function calcular(User $usuario): SafeToSpendResultado
    {
        // 1. Renda já recebida ESTE MÊS (rendas.data_recebimento no mês corrente) — nunca projetada.
        // 2. Menos obrigações fixas ativas do usuário (soma de obrigacoes_fixas.valor onde ativa=true).
        // 3. Menos gastos já lançados este mês.
        // 4. Dividido pelas semanas que restam no mês corrente (segunda a domingo, timezone America/Sao_Paulo).
        // 5. Colchão NÃO entra automaticamente aqui — é rede de segurança, não parte do cálculo padrão
        //    (ver Fase 4). Expor o saldo do colchão à parte no mesmo endpoint, pro front decidir como mostrar.
    }
}
```

Endpoint: `GET /api/painel/dado-da-semana` (nome sugerido) — devolve o valor calculado + saldo do
colchão + o total gasto/recebido no mês, tudo num payload só (a tela principal do front é uma
`bd-card` que junta os três).

Regra de negócio finalizada nesta sessão (não redecidir): **modo prudente é o único modo por
ora** — nunca projetar renda futura no cálculo. Se um dia entrar um "modo otimista", é opt-in
explícito do usuário, nunca o padrão.

### Fase 4 — Backend: Colchão (fechamento mensal automático)

Decisão já tomada (não redecidir): **fechamento mensal automático**, não ajuste contínuo a cada
lançamento. Comando agendado (`php artisan colchao:fechar-mes`, via `routes/console.php` +
`Schedule::command(...)->monthlyOn(1, '00:10')` ou equivalente):

1. Pra cada usuário, compara renda total do mês fechado vs. uma linha de base (média ponderada dos
   últimos 3 meses, mais peso pro mês mais recente — critério exato ainda em aberto, validar com o
   usuário antes de implementar).
2. Se sobrou (renda > linha de base): aporte automático de uma fatia do excedente (ex. 20% —
   também em aberto) via `movimentos_colchao` (`tipo: aporte_automatico`).
3. Se faltou: saque automático de uma fatia do déficit, limitado ao saldo disponível do colchão
   (nunca deixa saldo negativo) via `movimentos_colchao` (`tipo: saque_automatico`).
4. `CushionService::fecharMes(User $usuario): ?MovimentoColchao` — testável isoladamente, chamado
   pelo command.

**Antes de implementar**: validar com o usuário os dois parâmetros em aberto (janela da linha de
base, percentual de aporte/saque) — não travar um número sem confirmar.

### Fase 5 — Frontend: telas de lançamento

`features/rendas/`, `features/gastos/`, `features/obrigacoes/` — formulário simples (reativo,
`bandeira-ui` `bd-field`/`bd-input`), lista com edição/exclusão. Mesmo padrão de serviço do
`AuthService` (um `*.service.ts` por recurso em `core/` ou `features/*/data/` — decidir na hora
seguindo o critério de "Estrutura de pastas" do `vitality-front`: 1 tela usa → dentro da feature;
2+ usam → sobe pra `services/`).

### Fase 6 — Frontend: Dashboard real

Troca o placeholder estático (`dashboard.component.html`) pelos dados de `GET /api/painel/dado-da-
semana`. O reservatório do colchão (hoje uma barra estática) ganha o nível real — considerar
reaproveitar a linguagem visual do `plate-loader`/reservatório do Vitality PLUS (ver
`bandeira-ui`) em vez de inventar um componente novo do zero.

### Fase 7 — Frontend: "sua história do mês"

Texto gerado a partir do resumo do mês (renda total, gasto total, categoria que mais pesou,
movimento do colchão) — narrativa, não painel de gráficos (decisão de produto já tomada). Pode
começar com um template de frases fixas preenchidas por dado real; IA generativa é upgrade
futuro, não bloqueia esta fase.

## Stretch (sem data, avaliar quando chegar)

- **Metas concretas com recompensa visível** (ver ideação inicial do produto) — provavelmente
  reaproveita `MetaRevealComponent`/`journey-map` do Vitality PLUS como referência visual.
  Precisaria de uma tabela `metas` (`usuario_id, titulo, valor_alvo, valor_atual, data_alvo,
icone`) — ainda não desenhada em detalhe.
- Categorias de gasto por usuário (hoje são globais/seedadas) — só se a demanda de personalização
  aparecer de verdade.
- Renda por fonte normalizada (`income_sources`) — hoje `rendas.fonte` é string livre; normalizar
  só se precisar agregar/analisar por cliente/fonte.
