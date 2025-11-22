import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { listsTable, listItemsTable } from "./schema"

// Pool de conexão reutilizado entre invocações (importante para serverless)
let pool: Pool | null = null

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1, // Serverless: use conexões mínimas
    })
  }
  return pool
}

// Instância do Drizzle com schema
export const db = drizzle(getPool(), {
  schema: { listsTable, listItemsTable },
})

export { listsTable, listItemsTable }
