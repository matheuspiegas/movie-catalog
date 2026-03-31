import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { listMembersService } from "@/lib/services/list-members"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    await requireUserId()
    const { listId } = await params
    
    const members = await listMembersService.getByListId(listId)
    return NextResponse.json({ members }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
