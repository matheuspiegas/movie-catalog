import type { Context } from "@netlify/functions"
import {
  requireAuth,
  type AuthenticatedRequest,
  corsHeaders,
  handleCors,
} from "./lib/auth"
import { db, listsTable } from "./lib/db/db"
import { listItemsTable } from "./lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

// GET /list-items/:listId - Retorna todos os itens de uma lista
async function getListItems(req: AuthenticatedRequest, listId: string) {
  // Verifica se a lista pertence ao usuário
  const [list] = await db
    .select()
    .from(listsTable)
    .where(and(eq(listsTable.id, listId), eq(listsTable.userId, req.userId)))

  if (!list) {
    return new Response(
      JSON.stringify({ error: "List not found or unauthorized" }),
      { status: 404, headers: corsHeaders }
    )
  }

  // Busca os itens da lista
  const items = await db
    .select()
    .from(listItemsTable)
    .where(eq(listItemsTable.listId, listId))
    .orderBy(desc(listItemsTable.addedAt))

  return new Response(JSON.stringify(items), {
    status: 200,
    headers: corsHeaders,
  })
}

// POST /list-items/:listId - Adiciona um filme/série à lista
async function addListItem(req: AuthenticatedRequest, listId: string) {
  const body = await req.json()
  console.log("Request body for adding list item:", body) // Debug log

  // Verifica se a lista pertence ao usuário
  const [list] = await db
    .select()
    .from(listsTable)
    .where(
      and(eq(listsTable.id, body.listId), eq(listsTable.userId, req.userId))
    )

  if (!list) {
    return new Response(
      JSON.stringify({ error: "List not found or unauthorized" }),
      { status: 404, headers: corsHeaders }
    )
  }

  // Validação básica
  if (!body.movieId || !body.movieTitle || !body.mediaType) {
    return new Response(
      JSON.stringify({
        error: "movieId, movieTitle and mediaType are required",
      }),
      { status: 400, headers: corsHeaders }
    )
  }

  // Verifica se o filme já está na lista
  const [existingItem] = await db
    .select()
    .from(listItemsTable)
    .where(
      and(
        eq(listItemsTable.listId, listId),
        eq(listItemsTable.movieId, body.movieId)
      )
    )

  if (existingItem) {
    return new Response(JSON.stringify({ error: "Item already in list" }), {
      status: 409,
      headers: corsHeaders,
    })
  }

  // Adiciona o item
  const [newItem] = await db
    .insert(listItemsTable)
    .values({
      listId,
      movieId: body.movieId,
      movieTitle: body.movieTitle,
      moviePosterPath: body.moviePosterPath || null,
      movieReleaseDate: body.movieReleaseDate || null,
      movieVoteAverage: body.movieVoteAverage || null,
      mediaType: body.mediaType,
    })
    .returning()

  return new Response(JSON.stringify(newItem), {
    status: 201,
    headers: corsHeaders,
  })
}

// DELETE /list-items/:listId/:itemId - Remove um item da lista
async function removeListItem(
  req: AuthenticatedRequest,
  listId: string,
  itemId: string
) {
  // Verifica se a lista pertence ao usuário
  const [list] = await db
    .select()
    .from(listsTable)
    .where(and(eq(listsTable.id, listId), eq(listsTable.userId, req.userId)))

  if (!list) {
    return new Response(
      JSON.stringify({ error: "List not found or unauthorized" }),
      { status: 404, headers: corsHeaders }
    )
  }

  // Remove o item
  await db
    .delete(listItemsTable)
    .where(
      and(eq(listItemsTable.id, itemId), eq(listItemsTable.listId, listId))
    )

  return new Response(null, { status: 204, headers: corsHeaders })
}

// Handler principal COM autenticação
export default requireAuth(
  async (req: AuthenticatedRequest, context: Context) => {
    // Handle CORS
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    const url = new URL(req.url)
    const pathParts = url.pathname.split("/").filter(Boolean)

    // Extrai IDs: /.netlify/functions/list-items/:listId/:itemId
    const listId = pathParts.length > 2 ? pathParts[3] : null
    const itemId = pathParts.length > 3 ? pathParts[4] : null

    if (!listId) {
      return new Response(JSON.stringify({ error: "List ID is required" }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    try {
      const method = req.method

      // GET /list-items/:listId - Lista itens
      if (method === "GET") {
        return await getListItems(req, listId)
      }

      // POST /list-items/:listId - Adiciona item
      if (method === "POST") {
        return await addListItem(req, listId)
      }

      // DELETE /list-items/:listId/:itemId - Remove item
      if (method === "DELETE" && itemId) {
        return await removeListItem(req, listId, itemId)
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      })
    } catch (error) {
      console.error("Error in list-items function:", error)
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        { status: 500, headers: corsHeaders }
      )
    }
  }
)
