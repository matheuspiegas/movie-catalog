import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { invitationsService } from "@/lib/services/invitations"
import { clerkClient } from "@clerk/nextjs/server"

export async function GET() {
  try {
    const userId = await requireUserId()
    
    // Get user email from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress
    
    if (!email) {
      return NextResponse.json(
        { message: "Nao foi possivel encontrar o e-mail do usuario" },
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
        { message: "listId e inviteeEmail sao obrigatorios" },
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
