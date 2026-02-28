import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import {
  createListItemSchema,
  listIdParamsSchema,
} from "@/lib/schemas/list-items.schema"
import { listItemsService } from "@/lib/services/list-items"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: { listId: string } }
) {
  try {
    const userId = await requireUserId()
    const { listId } = listIdParamsSchema.parse(params)
    const items = await listItemsService.getAllByList(listId, userId)

    return NextResponse.json({ items }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: { listId: string } }
) {
  try {
    const userId = await requireUserId()
    const { listId } = listIdParamsSchema.parse(params)
    const body = createListItemSchema.parse(await request.json())
    const item = await listItemsService.create(listId, userId, body)

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
