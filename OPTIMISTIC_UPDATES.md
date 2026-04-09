# Atualizacoes Otimistas

Este documento registra as atualizacoes otimistas que ja foram implementadas no projeto.

## Fluxos implementados

### 1. Remocao de item da lista

Arquivos principais:

- `src/hooks/api/useListItems.ts`
- `src/screens/list.tsx`

Query afetada:

- `apiListItemsKeys.all(listId)`

Comportamento implementado:

1. `onMutate`
   - cancela queries em andamento da lista de itens
   - guarda snapshot anterior em `previousItems`
   - remove o item imediatamente do cache
2. `onError`
   - restaura `previousItems` em caso de falha
3. `onSettled`
   - invalida `apiListItemsKeys.all(listId)` para sincronizar com o servidor
4. `onSuccess`
   - exibe toast de sucesso

Objetivo:

- fazer o item sumir da interface imediatamente, sem esperar a resposta da API

### 2. Exclusao de lista

Arquivos principais:

- `src/hooks/api/useLists.ts`
- `src/screens/list.tsx`
- `src/app/api/lists/[listId]/route.ts`
- `src/lib/services/lists.ts`

Queries afetadas:

- `apiListsKeys.all`
- `apiListsKeys.detail(listId)`

Comportamento implementado:

1. `onMutate`
   - cancela queries da colecao e do detalhe
   - guarda snapshots em `previousLists` e `previousList`
   - remove a lista da colecao de forma otimista
   - limpa o cache de detalhe da lista
2. `onError`
   - restaura os caches `all` e `detail`
3. `onSettled`
   - invalida `apiListsKeys.all`
   - invalida `apiListsKeys.detail(listId)` apenas em caso de erro
4. `onSuccess`
   - remove a query de detalhe da lista excluida
   - exibe toast de sucesso
   - a tela navega para `/lists`

Objetivo:

- remover a lista da UI imediatamente sem quebrar a tela de detalhe durante a exclusao

## Ajustes estruturais feitos para suportar o delete otimista

### Query de detalhe da lista

Foi adicionada uma query dedicada para buscar uma lista especifica:

- hook: `useApiList(listId)` em `src/hooks/api/useLists.ts`
- service: `apiListsService.getList(listId)` em `src/services/api/lists.ts`
- rota: `GET /api/lists/[listId]`

Isso desacoplou a tela `src/screens/list.tsx` da query de colecao `useApiLists()`.

### Validacao de acesso no backend

O service de listas passou a validar:

1. se a lista existe
2. se o usuario autenticado pertence a lista

Arquivo:

- `src/lib/services/lists.ts`

## Padrao seguido nas mutacoes otimistas

O padrao adotado foi:

1. `onMutate`
   - cancelar queries relacionadas
   - tirar snapshot
   - atualizar cache local imediatamente
2. `onError`
   - fazer rollback com o snapshot
3. `onSettled`
   - invalidar queries para reconciliar com o estado real do servidor
4. `onSuccess`
   - executar efeitos de sucesso, como toast e navegacao

## Observacoes

- Atualizacao otimista nao substitui sincronizacao com o backend.
- O cache otimista representa uma previsao local; o `invalidateQueries` continua sendo responsavel por confirmar o estado final.
- O fluxo de remocao de item e o fluxo de exclusao de lista ja seguem esse modelo.

## Proximos candidatos

### 1. Atualizacao de lista

Arquivo principal:

- `src/hooks/api/useLists.ts`

Queries afetadas:

- `apiListsKeys.detail(id)`
- `apiListsKeys.all`

Viabilidade:

- alta

Motivo:

- a mutation ja retorna a lista atualizada
- a tela de detalhe e a listagem podem ser sincronizadas com pouco risco

Estrategia recomendada:

1. `onMutate`
   - cancelar `detail(id)` e `all`
   - guardar snapshots anteriores
   - atualizar nome e descricao no cache de detalhe
   - atualizar o item correspondente dentro da lista em `all`
2. `onError`
   - restaurar os snapshots
3. `onSettled`
   - invalidar `detail(id)` e `all`

### 2. Recusa de convite

Arquivo principal:

- `src/hooks/api/useInvitations.ts`

Query afetada:

- `apiInvitationsKeys.pending()`

Viabilidade:

- alta

Motivo:

- o fluxo remove um item de uma lista em cache, igual ao caso de remocao de item
- afeta diretamente a pagina de convites e o badge da navbar

Estrategia recomendada:

1. `onMutate`
   - cancelar `pending()`
   - guardar snapshot dos convites
   - remover o convite otimisticamente
2. `onError`
   - restaurar snapshot
3. `onSettled`
   - invalidar `pending()`

### 3. Remocao de membro

Arquivo principal:

- `src/hooks/api/useListMembers.ts`

Query afetada:

- `apiListMembersKeys.byList(listId)`

Viabilidade:

- alta

Motivo:

- tambem e um fluxo de remocao simples em uma colecao em cache
- o backend tem regras claras de permissao, entao rollback fica previsivel

Estrategia recomendada:

1. `onMutate`
   - cancelar a query de membros da lista
   - guardar snapshot anterior
   - remover o membro da UI imediatamente
2. `onError`
   - restaurar snapshot
3. `onSettled`
   - invalidar a query da lista de membros

### 4. Criacao de lista

Arquivo principal:

- `src/hooks/api/useLists.ts`

Query afetada:

- `apiListsKeys.all`

Viabilidade:

- media

Motivo:

- precisa criar uma lista temporaria no cache antes da resposta do backend
- exige reconciliar `id`, `createdAt` e `updatedAt` retornados pelo servidor

Estrategia recomendada:

1. `onMutate`
   - cancelar `all`
   - guardar snapshot anterior
   - inserir uma lista temporaria com `id` fake
2. `onError`
   - restaurar snapshot
3. `onSuccess`
   - substituir a lista temporaria pela lista real retornada pela API
4. `onSettled`
   - invalidar `all`

### 5. Adicao de item a lista

Arquivos principais:

- `src/hooks/api/useListItems.ts`
- `src/components/add-to-list-dialog.tsx`

Query afetada:

- `apiListItemsKeys.all(listId)`

Viabilidade:

- media

Motivo:

- requer item temporario no cache
- precisa lidar com conflito `409` quando o item ja existe na lista
- o componente ainda pode exigir ajuste para depender do hook centralizado

Estrategia recomendada:

1. `onMutate`
   - cancelar query dos itens
   - guardar snapshot anterior
   - inserir item temporario com `id` fake e metadata provisoria
2. `onError`
   - restaurar snapshot
3. `onSuccess`
   - reconciliar item temporario com o item real retornado pela API
4. `onSettled`
   - invalidar a query da lista de itens

### 6. Aceite de convite

Arquivo principal:

- `src/hooks/api/useInvitations.ts`

Queries afetadas:

- `apiInvitationsKeys.pending()`
- `apiListsKeys.all`

Viabilidade:

- media/baixa com o contrato atual

Motivo:

- remover o convite do cache e simples
- adicionar a lista recebida pelo aceite ao cache de `all` nao e tao simples se a API nao retornar todos os campos necessarios da lista

Estrategia recomendada:

1. abordagem minima
   - fazer otimista apenas na remocao do convite pendente
   - invalidar `apiListsKeys.all` no final
2. abordagem ideal
   - ajustar a API para retornar a lista completa ao aceitar o convite
   - entao reconciliar `pending()` e `all` de forma otimista

## Ordem sugerida de implementacao

1. Atualizacao de lista
2. Recusa de convite
3. Remocao de membro
4. Criacao de lista
5. Adicao de item a lista
6. Aceite de convite
