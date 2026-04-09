import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { listMembersService } from "@/lib/services/list-members"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listId: string; memberId: string }> },
) {
  try {
    const userId = await requireUserId()
    const { listId, memberId } = await params

    await listMembersService.removeMember(listId, memberId, userId)
    return NextResponse.json({ message: "Membro removido" }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
