import type { Context } from "@netlify/functions"
import {
  requireAuth,
  type AuthenticatedRequest,
  corsHeaders,
  handleCors,
} from "./lib/auth"
import { db, listsTable } from "./lib/db/db"
import { eq, and, desc } from "drizzle-orm"

// GET /lists - Retorna todas as listas do usuário
async function getLists(req: AuthenticatedRequest) {
  const lists = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.userId, req.userId))
    .orderBy(desc(listsTable.createdAt))

  return new Response(JSON.stringify(lists), {
    status: 200,
    headers: corsHeaders,
  })
}

// POST /lists - Cria nova lista
async function createList(req: AuthenticatedRequest) {
  const body = await req.json()

  // Validação básica
  if (!body.name || typeof body.name !== "string") {
    return new Response(
      JSON.stringify({ error: "Name is required and must be a string" }),
      { status: 400, headers: corsHeaders }
    )
  }

  if (body.name.length > 100) {
    return new Response(
      JSON.stringify({ error: "Name must be less than 100 characters" }),
      { status: 400, headers: corsHeaders }
    )
  }

  // Insere no banco
  const [newList] = await db
    .insert(listsTable)
    .values({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      userId: req.userId,
    })
    .returning()

  return new Response(JSON.stringify(newList), {
    status: 201,
    headers: corsHeaders,
  })
}

// PUT /lists/:id - Atualiza lista
async function updateList(req: AuthenticatedRequest, listId: string) {
  const body = await req.json()

  // Verifica se a lista existe e pertence ao usuário
  const [existingList] = await db
    .select()
    .from(listsTable)
    .where(and(eq(listsTable.id, listId), eq(listsTable.userId, req.userId)))

  if (!existingList) {
    return new Response(
      JSON.stringify({ error: "List not found or unauthorized" }),
      { status: 404, headers: corsHeaders }
    )
  }

  // Atualiza
  const [updatedList] = await db
    .update(listsTable)
    .set({
      name: body.name?.trim() || existingList.name,
      description:
        body.description !== undefined
          ? body.description?.trim()
          : existingList.description,
      updatedAt: new Date(),
    })
    .where(eq(listsTable.id, listId))
    .returning()

  return new Response(JSON.stringify(updatedList), {
    status: 200,
    headers: corsHeaders,
  })
}

// DELETE /lists/:id - Deleta lista
async function deleteList(req: AuthenticatedRequest, listId: string) {
  // Verifica se a lista pertence ao usuário
  const [existingList] = await db
    .select()
    .from(listsTable)
    .where(and(eq(listsTable.id, listId), eq(listsTable.userId, req.userId)))

  if (!existingList) {
    return new Response(
      JSON.stringify({ error: "List not found or unauthorized" }),
      { status: 404, headers: corsHeaders }
    )
  }

  // Deleta
  await db.delete(listsTable).where(eq(listsTable.id, listId))

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

    // Extrai ID se presente: /.netlify/functions/lists/:id
    const listId = pathParts.length > 2 ? pathParts[3] : null

    try {
      const method = req.method
      console.log(
        `Handling ${method} request for lists function, listId: ${listId}`
      )

      // GET /lists - Lista todas
      if (method === "GET" && !listId) {
        return await getLists(req)
      }

      // POST /lists - Cria nova
      if (method === "POST" && !listId) {
        return await createList(req)
      }

      // PUT /lists/:id - Atualiza
      if (method === "PUT" && listId) {
        return await updateList(req, listId)
      }

      // DELETE /lists/:id - Deleta
      if (method === "DELETE" && listId) {
        return await deleteList(req, listId)
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      })
    } catch (error) {
      console.error("Error in lists function:", error)
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
