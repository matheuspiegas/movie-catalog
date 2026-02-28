import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { handleApiError } from "@/lib/errors"
import { createListSchema } from "@/lib/schemas/lists.schema"
import { listsService } from "@/lib/services/lists"
import { auth } from "@clerk/nextjs/server"


export async function GET() {
  try {
    const userId = await requireUserId()
    const lists = await listsService.getAllByUser(userId)

    return NextResponse.json({ lists }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    const body = createListSchema.parse(await request.json())
    const list = await listsService.create(userId, body)

    return NextResponse.json({ list }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
