# Renda Viva — frontend

App de gestão financeira pra quem não tem salário fixo. Diferencial: "quanto dá pra gastar essa
semana" calculado sobre renda que já entrou (nunca projetada), com um colchão automático que
suaviza os meses ruins — e uma linguagem sem culpa (sem vermelho de "estourou o orçamento").

Angular 20 (standalone, signals, `OnPush`) + Tailwind v4 (CSS-first) + `bandeira-ui` +
`bandeira-shell`, consumindo o backend Laravel em `../renda-viva-back`.

## Stack

- Angular 20, Tailwind v4, `bandeira-ui`/`bandeira-shell` (mesmo padrão do `vitality-front` — ver
  aquele `CLAUDE.md` pra entender as convenções por trás: por que tarball local em `vendor/`, por
  que `.postcssrc.json`, por que `SHELL_NAVIGATION_CONFIG` fica no `providers` do componente lazy
  e não em `app.config.ts`).
- Sem i18n/Capacitor/PrimeNG por ora — MVP enxuto, só o essencial pra validar o produto.
- Auth via Bearer token (Sanctum), sem cookies/CSRF.

## Como rodar

```bash
npm install
npm start          # http://localhost:4200
```

Backend em paralelo, em `../renda-viva-back`:

```bash
php artisan serve --port=8001
```

`.env` do backend já vem com `FRONTEND_URL=http://localhost:4200`.

## Estado atual (scaffold)

- ✅ Auth (login/registro/logout) ponta a ponta contra o backend real.
- ✅ Shell (`bandeira-shell`) com um item de menu (Dashboard).
- ✅ Tela principal em placeholder estático — "dá pra gastar essa semana", colchão, história do
  mês — layout pronto, sem dado real ainda.
- ⬜ Modelo de dados de renda/gasto/obrigação fixa (backend + frontend).
- ⬜ Motor de suavização de renda variável + cálculo do colchão.
