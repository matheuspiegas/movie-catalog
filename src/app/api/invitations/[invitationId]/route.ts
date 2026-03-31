import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { invitationsService } from "@/lib/services/invitations"
import { auth } from "@clerk/nextjs/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { sessionClaims } = await auth()
    const userId = await requireUserId()
    const { invitationId } = await params
    
    const email = sessionClaims?.email as string | undefined
    if (!email) {
      return NextResponse.json(
        { message: "Email not found in session" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === "accept") {
      await invitationsService.accept(invitationId, userId, email)
      return NextResponse.json({ message: "Invitation accepted" }, { status: 200 })
    } else if (action === "reject") {
      await invitationsService.reject(invitationId, email)
      return NextResponse.json({ message: "Invitation rejected" }, { status: 200 })
    } else {
      return NextResponse.json(
        { message: "Invalid action. Use 'accept' or 'reject'" },
        { status: 400 }
      )
    }
  } catch (error) {
    return handleApiError(error)
  }
}
