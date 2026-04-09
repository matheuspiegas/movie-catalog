# AGENTS.md

## Comandos
- Use `pnpm`; o lockfile do repo e `pnpm-lock.yaml`.
- Desenvolvimento: `pnpm dev`
- Lint/format: `pnpm lint`, `pnpm lint:fix`, `pnpm format`.
- O typecheck real e `pnpm exec tsc --noEmit`. `pnpm build` nao substitui isso: `next.config.ts` esta com `typescript.ignoreBuildErrors` e `eslint.ignoreDuringBuilds` ativados.
- Build: `pnpm build`
- Banco local: `docker compose up -d postgres` sobe Postgres em `localhost:5432` com db `movie-catalog` e user/senha `postgres`.

## Estado Atual Verificado
- Nao ha `test` script, config de testes nem workflows em `.github`; nao presuma CI ou suite automatizada.
- `pnpm exec tsc --noEmit` falha hoje por tipagem de route handlers do Next 15 em:
  - `src/app/api/lists/[listId]/items/route.ts`
  - `src/app/api/lists/[listId]/items/[itemId]/route.ts`
- Ao criar/editar rotas dinamicas em `src/app/api`, siga o padrao que ja esta correto em `src/app/api/lists/[listId]/route.ts`: `params` e `Promise<...>` e deve ser aguardado.

## Arquitetura
- `src/app/*/page.tsx` sao wrappers minimos; a UI real das paginas fica em `src/screens/*`. Para mudar uma tela, edite a screen correspondente.
- Layout global: `src/app/layout.tsx` injeta Clerk; `src/app/client-layout.tsx` injeta React Query, `NuqsAdapter`, navbar e toaster.
- Fluxo das features de listas/convites:
  - cliente: `src/services/api/*` -> `src/hooks/api/*`
  - rotas Next: `src/app/api/*`
  - regras server-only: `src/lib/services/*`
  - validacao: `src/lib/schemas/*`
  - banco: `src/lib/db.ts` + `src/db/schema.ts`
- `src/services/tmdb.ts` centraliza acesso ao TMDB; evite espalhar fetches diretos para o TMDB em componentes.
- Estilo usa Tailwind CSS 4 via `postcss.config.js`; nao ha `tailwind.config.*` no repo.

## Banco, Auth e Env
- `DATABASE_URL` e obrigatoria ja no import de `src/lib/db.ts` e `drizzle.config.ts`; rotas de listas, membros, itens e convites dependem disso.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e obrigatoria; `src/app/layout.tsx` lanca erro na inicializacao sem ela.
- `NEXT_PUBLIC_TMDB_READ_ACCESS_TOKEN` e lida em `src/services/tmdb.ts`.
- Schema Drizzle: `src/db/schema.ts`. SQLs versionados ficam em `drizzle/`.
- Nao ha script de migration no `package.json`; confira `drizzle.config.ts` antes de inferir comandos de Drizzle.

## Convencoes Uteis
- APIs autenticadas usam `requireUserId()` e `handleApiError()`; mantenha esse padrao em novas rotas.
- Nas features de listas, autorizacao real passa por `list_members`; nao assuma que `lists.userId` sozinho define acesso ou escrita.
- Ja existem atualizacoes otimistas em hooks de React Query (`src/hooks/api/*`), especialmente em listas e itens; preserve `onMutate`, rollback e invalidacao ao mexer nessas mutations.
