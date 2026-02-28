import "server-only"
import { auth } from "@clerk/nextjs/server"
import { UnauthorizedError } from "@/lib/errors"

export async function requireUserId() {
  const { userId } = await auth()

  if (!userId) {
    throw new UnauthorizedError()
  }

  return userId
}
