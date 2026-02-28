# Migracao para Next.js App Router

## Mapeamento de rotas (App Router)

Base sugerida: `app/api/`

### Listas

- `GET /api/lists` -> `app/api/lists/route.ts` (listar listas do usuario)
- `POST /api/lists` -> `app/api/lists/route.ts` (criar lista)
- `PUT /api/lists/[listId]` -> `app/api/lists/[listId]/route.ts` (atualizar lista)
- `DELETE /api/lists/[listId]` -> `app/api/lists/[listId]/route.ts` (deletar lista)

### Itens da lista

- `GET /api/lists/[listId]/items` -> `app/api/lists/[listId]/items/route.ts` (listar itens)
- `POST /api/lists/[listId]/items` -> `app/api/lists/[listId]/items/route.ts` (adicionar item)
- `DELETE /api/lists/[listId]/items/[itemId]` -> `app/api/lists/[listId]/items/[itemId]/route.ts` (remover item)

## Modulos auxiliares (fora de app/api)

- `src/lib/db.ts` (drizzle + pool)
- `src/lib/auth.ts` (Clerk: extrair `userId`)
- `src/lib/services/*` (listas e itens)
- `src/lib/schemas/*` (Zod)
- `src/lib/errors.ts` (erros customizados e helper para `Response`)

## Plano resumido de migracao

1. Criar estrutura de rotas no `app/api` conforme o mapeamento acima.
2. Adaptar autenticacao do Clerk para o App Router.
3. Reaproveitar services e schemas, ajustando respostas para `NextResponse`.
4. Ajustar tratamento de erros para retornar `Response` adequado.
5. Validar envs no Next (server-only).
6. Testar manualmente cada handler.

## Detalhamento por modulo

### Modulo: Listas

Arquivos atuais (API Fastify):

- Rotas: `/home/matheuspiegas/projetos/movie-catalog-api/src/routes/lists.routes.ts`
- Controller: `/home/matheuspiegas/projetos/movie-catalog-api/src/controllers/lists.controller.ts`
- Service: `/home/matheuspiegas/projetos/movie-catalog-api/src/services/lists.service.ts`
- Schemas (Zod): `/home/matheuspiegas/projetos/movie-catalog-api/src/schemas/lists.schema.ts`
- Tabela: `/home/matheuspiegas/projetos/movie-catalog-api/src/db/schema.ts` (tabela `lists`)
- Auth: `/home/matheuspiegas/projetos/movie-catalog-api/src/middlewares/auth.middleware.ts`
- Erros: `/home/matheuspiegas/projetos/movie-catalog-api/src/utils/error-handler.ts`

Responsabilidade:

- Controller valida entrada (Zod) e traduz para HTTP (status + payload).
- Service aplica regras de negocio e autorizacao (ownership por `userId`) e faz queries no banco.
- Auth injeta `request.getCurrentUserId()` (via Clerk) e bloqueia chamadas sem usuario autenticado.

Modelo (tabela `lists`):

- `id` (uuid, pk)
- `name` (text, obrigatorio)
- `description` (text, opcional)
- `created_at` (timestamp, defaultNow)
- `updated_at` (timestamp, defaultNow; no update e setado manualmente)
- `user_id` (text, obrigatorio; dono da lista)

Endpoints (comportamento atual):

- `GET /api/lists`
  - Auth: obrigatorio (usa `request.getCurrentUserId()`)
  - Service: `listsService.getAllByUser(userId)` (filtra por `lists.userId`)
  - Resposta: `200 { lists: [...] }`

- `POST /api/lists`
  - Auth: obrigatorio
  - Body (Zod: `createListSchema`):
    - `name`: string (1..255)
    - `description?`: string (max 1000)
  - Service: `listsService.create(userId, { name, description })`
  - Resposta: `201 { list: ... }`

- `PUT /api/lists/:listId`
  - Auth: obrigatorio
  - Params (Zod: `listParamsSchema`):
    - `listId`: uuid
  - Body (Zod: `updateListSchema`):
    - `name?`: string (1..255)
    - `description?`: string (max 1000)
    - Regra: precisa enviar pelo menos um campo (`name` ou `description`)
  - Service: `listsService.update(listId, userId, data)`
    - Busca lista por id
    - 404 se nao existir
    - 403 se `existingList.userId !== userId`
    - Faz update parcial e seta `updatedAt = new Date().toISOString()`
  - Resposta: `200 { list: ... }`

- `DELETE /api/lists/:listId`
  - Auth: obrigatorio
  - Params (Zod: `listParamsSchema`): `listId` uuid
  - Service: `listsService.delete(listId, userId)`
    - Busca lista por id
    - 404 se nao existir
    - 403 se `existingList.userId !== userId`
    - Deleta a lista; itens sao removidos por cascade (`list_items` FK onDelete=cascade)
  - Resposta: `200 { message: 'List deleted successfully' }`

Erros e codigos (padrao atual):

- 401: sem autenticacao (`UnauthorizedError`)
- 400: validacao Zod / `ValidationError`
- 403: lista existe mas nao pertence ao usuario (`ForbiddenError`)
- 404: lista nao encontrada (`NotFoundError`)
- 500: erro inesperado (error handler global)

Notas para migracao (App Router):

- Cada handler do Next deve extrair `userId` via Clerk no server (`@clerk/nextjs/server`) e manter as mesmas regras (ownership + mesmos schemas Zod).
- Reaproveitamento direto: `src/schemas/lists.schema.ts` e a logica do service (com ajuste de imports/db).

### Modulo: Itens de lista (List Items)

Arquivos atuais (API Fastify):

- Rotas: `/home/matheuspiegas/projetos/movie-catalog-api/src/routes/list-items.routes.ts`
- Controller: `/home/matheuspiegas/projetos/movie-catalog-api/src/controllers/list-items.controller.ts`
- Service: `/home/matheuspiegas/projetos/movie-catalog-api/src/services/list-items.service.ts`
- Schemas (Zod): `/home/matheuspiegas/projetos/movie-catalog-api/src/schemas/list-items.schema.ts`
- Tabelas: `/home/matheuspiegas/projetos/movie-catalog-api/src/db/schema.ts` (tabelas `list_items` e `lists`)
- Auth: `/home/matheuspiegas/projetos/movie-catalog-api/src/middlewares/auth.middleware.ts`
- Erros: `/home/matheuspiegas/projetos/movie-catalog-api/src/utils/error-handler.ts`

Responsabilidade:

- Controller valida params/body (Zod) e traduz para HTTP.
- Service verifica ownership da lista (comparando `lists.userId` com `userId`) e executa CRUD de itens.

Modelo (tabela `list_items`):

- `id` (uuid, pk)
- `list_id` (uuid, fk -> `lists.id`, onDelete=cascade)
- `movie_id` (integer, obrigatorio)
- `movie_title` (text, obrigatorio)
- `movie_poster_path` (text, opcional)
- `movie_release_date` (text, opcional)
- `movie_vote_average` (text, opcional)
- `media_type` (text, obrigatorio)
- `added_at` (timestamp, defaultNow)

Schemas (Zod):

- `listIdParamsSchema`: `listId` uuid
- `listItemParamsSchema`: `listId` uuid + `itemId` uuid
- `createListItemSchema`:
  - `movieId`: number int positivo
  - `movieTitle`: string (1..500)
  - `moviePosterPath?`: string (max 500)
  - `movieReleaseDate?`: string (max 50)
  - `movieVoteAverage?`: string (max 10)
  - `mediaType`: string (1..50)

Endpoints (comportamento atual):

- `GET /api/lists/:listId/items`
  - Auth: obrigatorio (usa `request.getCurrentUserId()`)
  - Params (Zod: `listIdParamsSchema`): `listId` uuid
  - Service: `listItemsService.getAllByList(listId, userId)`
    - 404 se a lista nao existir
    - 403 se a lista nao pertencer ao usuario
    - Retorna itens filtrando por `listItems.listId = listId`
  - Resposta: `200 { items: [...] }`

- `POST /api/lists/:listId/items`
  - Auth: obrigatorio
  - Params (Zod: `listIdParamsSchema`): `listId` uuid
  - Body (Zod: `createListItemSchema`)
  - Service: `listItemsService.create(listId, userId, data)`
    - 404 se a lista nao existir
    - 403 se a lista nao pertencer ao usuario
    - Insere item em `list_items` e retorna o registro
  - Resposta: `201 { item: ... }`

- `DELETE /api/lists/:listId/items/:itemId`
  - Auth: obrigatorio
  - Params (Zod: `listItemParamsSchema`): `listId` uuid, `itemId` uuid
  - Service: `listItemsService.delete(listId, itemId, userId)`
    - 404 se a lista nao existir
    - 403 se a lista nao pertencer ao usuario
    - 404 se o item nao existir dentro da lista
    - Deleta por `listItems.id = itemId`
  - Resposta: `204` (sem body)

Erros e codigos (padrao atual):

- 401: sem autenticacao (`UnauthorizedError`)
- 400: validacao Zod / `ValidationError`
- 403: lista nao pertence ao usuario (`ForbiddenError`)
- 404: lista ou item nao encontrado (`NotFoundError`)
- 500: erro inesperado

Notas para migracao (App Router):

- Handler deve receber `listId`/`itemId` via params de rota e validar com os mesmos schemas.
- Para `DELETE`, manter sem body (em Next: retornar `new Response(null, { status: 204 })`).
- Reaproveitamento direto: `src/schemas/list-items.schema.ts` e a logica do service (com ajuste de imports/db).
