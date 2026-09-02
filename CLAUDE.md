# Renda Viva — Frontend

App de gestão financeira pra quem não tem salário fixo. Diferencial: "quanto dá pra gastar essa
semana" calculado sobre renda que **já entrou** (nunca projetada), com um colchão automático que
suaviza os meses ruins, e uma linguagem sem culpa (sem vermelho de "estourou o orçamento"). Este
documento é a referência viva do projeto — sempre que uma decisão de arquitetura mudar ou o
contrato da API for corrigido, atualize aqui. Roadmap de features em
[`PROXIMAS-FEATURES.md`](./PROXIMAS-FEATURES.md) — comece por lá antes de implementar algo novo.

## Stack

- **Angular 20** (standalone components, `ChangeDetectionStrategy.OnPush` sempre, Signals para
  todo estado, `inject()` em vez de constructor injection, lazy loading via `loadComponent` em
  toda rota de feature).
- **Tailwind v4** (CSS-first, sem `tailwind.config.js`) — exige `.postcssrc.json` na raiz
  (`{ "plugins": { "@tailwindcss/postcss": {} } }`), mesmo bug/correção documentado no
  `vitality-front`: sem esse arquivo, nenhuma classe utilitária é gerada, silenciosamente.
- **`bandeira-ui`** (design system) + **`bandeira-shell`** (motor de app shell) — os dois
  instalados via tarball local em `vendor/*.tgz`, mesmo padrão do `vitality-front`. **Três entry
  points do `bandeira-shell`**, cada um resolve pacotes diferentes — importar do errado quebra o
  build ou infla o bundle:
  - `bandeira-shell` (default) — `provideShellTheme`, `provideShellPalette`,
    `provideShellNavigation`, `BsThemeService`, `BsPaletteService`, `BsNavigationLayoutService`,
    `BsOverlayStackService`. Leve, sem Router/ícones/Capacitor.
  - `bandeira-shell/ui` — `BsShellComponent`, `BsPalettePickerComponent`. Pesado (Router,
    `bandeira-ui`, ícones Lucide) — só importar dentro de componentes lazy.
  - `bandeira-shell/native` — `BsPlatformService`, `BsNativeShellService`, `provideShellNative`.
    Resolve `@capacitor/*` — **este projeto não usa** (sem app nativo por ora), não importar.
  - **Regra de ouro**: `SHELL_NAVIGATION_CONFIG` nunca em `app.config.ts` nem no objeto da rota
    (`app.routes.ts`) — os dois são importados de forma _eager_ pelo bootstrap, então qualquer
    ícone Lucide usado nos itens de menu vazaria pro bundle inicial. Registrar sempre no
    `providers` do `@Component` que é carregado via `loadComponent` (ver
    `core/layout/app-shell/app-shell.component.ts`) — só assim fica de fato lazy.
- **Sem i18n, sem Capacitor, sem PrimeNG** por ora — MVP enxuto. Não adicionar nenhum dos três sem
  necessidade real de produto (não "porque o vitality-front tem").
- **Lucide** (`@lucide/angular`) pra ícones, mesmo padrão do `vitality-front` (componente
  standalone por ícone, sem módulo global).
- Testes: Jasmine/Karma (padrão do `ng new`).
- **Toda subscription de chamada à API é encerrada ao sair do componente** — mesmo padrão do
  vitality-front (`Subject<void>` + `takeUntil`), quando o componente tiver uma chamada que
  sobrevive à navegação. Ainda não apareceu no código atual (telas simples demais), mas vale
  desde a primeira tela com polling/stream.

## Como rodar

```bash
npm install
npm start          # http://localhost:4200
npm run build
npm test
```

Backend em paralelo, em `../renda-viva-back`:

```bash
php artisan serve --port=8001
```

O `.env` do backend já vem com `FRONTEND_URL=http://localhost:4200`. Sem isso, CORS bloqueia toda
chamada do front.

## Estrutura de pastas

```
src/app/
  core/
    auth/           AuthService, TokenStore, guards (authGuard/guestGuard), User model
    http/           api-paths.ts, authInterceptor
    layout/
      app-shell/    wrapper fino sobre <bs-shell> — só o que é específico do app
  features/
    auth/login/, auth/register/
    dashboard/
  shell-palette.config.ts   paleta(s) — fonte única, lida também por scripts/sync-index-html.mjs
  shell-nav.config.ts       itens de menu (ShellNavItem[]) — só usados dentro do app-shell lazy
```

Critério igual ao `vitality-front`: componente usado por 1 feature só → dentro dela; usado por 2+
→ sobe pra `components/`. Serviço usado por 1 tela → dentro da feature; usado por 2+ → sobe pra
`core/` (se for infraestrutura, auth, http) ou `services/` (se for domínio — ainda não existe essa
pasta, criar quando a Fase 5 do roadmap chegar).

## Decisões de arquitetura

- **Auth via Bearer token puro** (Sanctum), sem cookies/CSRF. `TokenStore` guarda em
  `localStorage` + signal em memória (mais simples que o `vitality-front`, que usa
  `Preferences`/Capacitor — este projeto não tem app nativo, não precisa).
- **`authInterceptor`** só anexa `Authorization` em requests pra `environment.apiBaseUrl` — nunca
  nas rotas de auth (`environment.apiUrl`, sem `/api`).
- **Sessão restaurada no boot** via `provideAppInitializer` em `app.config.ts`, antes da primeira
  navegação — mesmo padrão do `vitality-front`.
- **Sem tratamento de erro genérico ainda** (sem `errorInterceptor`/toast) — cada componente trata
  o próprio erro por ora (ver `login.component.ts`). Adicionar um `errorInterceptor` quando a
  segunda tela precisar do mesmo tratamento (critério de "promover só na segunda repetição").
- **Paleta "Calmo"** (azul-petróleo, `--bd-primary: #2f6f6b`) é provisória — deliberadamente longe
  do verde-dinheiro e do vermelho-alerta que todo app financeiro usa. Nome do projeto (Renda
  Viva) e paleta foram decididos juntos nesta sessão; não trocar sem necessidade de produto.
- **Classe `card`** (`@utility card` em `styles.scss`) — mesmo primitivo do `vitality-front`: só
  o casco (fundo + borda + raio), nunca embute padding. Sempre `class="card p-6"` ou similar.
- **Todo botão é pill** (`button[bdButton], a[bdButton] { border-radius: 999px !important; }`) —
  mesma convenção do `vitality-front`.
- **Script anti-flash gerado, não escrito à mão**: `scripts/sync-index-html.mjs` (rodado via
  `prestart`/`prebuild`, `node --experimental-strip-types`) regenera o bloco entre
  `<!-- ANTI_FLASH_START/END -->` de `index.html` a partir de `shell-palette.config.ts` — nunca
  editar esse bloco manualmente, e nunca duplicar a lista de paletas em outro lugar.
- **`ROTAS_RAIZ`/config de navegação NUNCA num arquivo que `app.config.ts` importa direto** — ver
  a regra de ouro do `bandeira-shell` acima. Se precisar adicionar um novo dado de config
  eager (ex. mais uma rota-raiz), pode ir direto em `app.config.ts`; qualquer coisa que carregue
  um ícone Lucide precisa ficar isolada e só chegar ao app via `providers` de componente lazy.

## Contrato da API (backend em `../renda-viva-back`)

Base local: `http://localhost:8001`. Ver `CLAUDE.md` do backend pra detalhe de cada tabela/coluna.

| Rota                           | Observação                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/login`              | `{email, password}` → `{status, token, user, message}`, 201. 404/401 por campo (tratado no `LoginComponent`, não como erro genérico). |
| `POST /api/criar-usuario`      | `{name, email, password, password_confirmation}` → `{message, data, success}`, 201. Não autentica — sempre redireciona pro `/login`.  |
| `GET /api/user/get-with-token` | Protegida — `{data: User}`.                                                                                                           |
| `POST /api/logout`             | Protegida — revoga o token atual.                                                                                                     |

Rotas de domínio (rendas/gastos/obrigações/colchão) ainda não existem — ver Fase 2+ de
`PROXIMAS-FEATURES.md`.
