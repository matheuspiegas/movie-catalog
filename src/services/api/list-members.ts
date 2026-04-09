import { apiRequest } from "./request"

export interface ListMember {
  id: string
  listId: string
  userId: string
  userName: string
  role: "owner" | "member"
  joinedAt: string
}

interface GetMembersResponse {
  members: ListMember[]
}

async function getListMembers(listId: string): Promise<ListMember[]> {
  const response = await apiRequest<GetMembersResponse>(
    `/lists/${listId}/members`,
    {
      method: "GET",
    },
  )
  return response.members
}

async function removeMember(listId: string, memberId: string): Promise<void> {
  await apiRequest<{ message: string }>(
    `/lists/${listId}/members/${memberId}`,
    {
      method: "DELETE",
    },
  )
}

export const apiListMembersService = {
  getListMembers,
  removeMember,
}
