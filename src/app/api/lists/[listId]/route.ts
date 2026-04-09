import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { listParamsSchema, updateListSchema } from "@/lib/schemas/lists.schema"
import { listsService } from "@/lib/services/lists"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listId: string }> },
) {
  try {
    const userId = await requireUserId()
    const { listId } = listParamsSchema.parse(await params)
    const list = await listsService.getList(listId, userId)

    return NextResponse.json({ list }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ listId: string }> },
) {
  try {
    const userId = await requireUserId()
    const { listId } = listParamsSchema.parse(await params)
    const body = updateListSchema.parse(await request.json())
    const list = await listsService.update(listId, userId, body)

    return NextResponse.json({ list }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listId: string }> },
) {
  try {
    const userId = await requireUserId()
    const { listId } = listParamsSchema.parse(await params)
    await listsService.delete(listId, userId)

    return NextResponse.json(
      { message: "List deleted successfully" },
      { status: 200 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
