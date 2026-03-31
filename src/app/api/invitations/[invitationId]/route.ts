import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { invitationsService } from "@/lib/services/invitations"
import { clerkClient } from "@clerk/nextjs/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { invitationId } = await params
    
    // Get user email from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress
    
    if (!email) {
      return NextResponse.json(
        { message: "Email not found for user" },
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
