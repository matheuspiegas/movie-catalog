import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { listMembersService } from "@/lib/services/list-members"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { listId } = await params
    
    const members = await listMembersService.getByListId(listId, userId)
    return NextResponse.json({ members }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
