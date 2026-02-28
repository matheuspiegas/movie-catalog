import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { listItemParamsSchema } from "@/lib/schemas/list-items.schema"
import { listItemsService } from "@/lib/services/list-items"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  { params }: { params: { listId: string; itemId: string } }
) {
  try {
    const userId = await requireUserId()
    const { listId, itemId } = listItemParamsSchema.parse(params)
    await listItemsService.delete(listId, itemId, userId)

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
