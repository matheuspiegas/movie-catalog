import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { invitationsService } from "@/lib/services/invitations"
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  try {
    const { sessionClaims } = await auth()
    const userId = await requireUserId()
    
    const email = sessionClaims?.email as string | undefined
    if (!email) {
      return NextResponse.json(
        { message: "Email not found in session" },
        { status: 400 }
      )
    }

    const invitations = await invitationsService.getPendingByEmail(email)
    return NextResponse.json({ invitations }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    
    const { listId, inviteeEmail } = body
    
    if (!listId || !inviteeEmail) {
      return NextResponse.json(
        { message: "listId and inviteeEmail are required" },
        { status: 400 }
      )
    }

    const invitation = await invitationsService.create(
      listId,
      userId,
      inviteeEmail
    )

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
