import "server-only"
import { clerkClient } from "@clerk/nextjs/server"

type ClerkUserLike = {
  id: string
  fullName: string | null
  firstName: string | null
  lastName: string | null
  username?: string | null
  emailAddresses: Array<{ emailAddress: string }>
}

export function getUserDisplayName(user: ClerkUserLike) {
  const fullName = user.fullName?.trim()
  if (fullName) {
    return fullName
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  if (name) {
    return name
  }

  const username = user.username?.trim()
  if (username) {
    return username
  }

  const email = user.emailAddresses[0]?.emailAddress?.trim()
  if (email) {
    return email
  }

  return user.id
}

export async function getUserSnapshotName(userId: string) {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return getUserDisplayName(user)
  } catch {
    return userId
  }
}

export async function getUserSnapshotNames(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds)]
  if (uniqueUserIds.length === 0) {
    return new Map<string, string>()
  }

  let client: Awaited<ReturnType<typeof clerkClient>>

  try {
    client = await clerkClient()
  } catch {
    return new Map(uniqueUserIds.map((userId) => [userId, userId]))
  }

  const names = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const user = await client.users.getUser(userId)
        return [userId, getUserDisplayName(user)] as const
      } catch {
        return [userId, userId] as const
      }
    }),
  )

  return new Map(names)
}
