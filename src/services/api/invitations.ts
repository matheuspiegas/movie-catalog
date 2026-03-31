import { apiRequest } from "./request"

export interface Invitation {
  id: string
  listId: string
  listName: string
  inviterUserId: string
  inviteeEmail: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
  respondedAt: string | null
}

export interface CreateInvitationInput {
  listId: string
  inviteeEmail: string
}

interface GetInvitationsResponse {
  invitations: Invitation[]
}

async function getPendingInvitations(): Promise<Invitation[]> {
  const response = await apiRequest<GetInvitationsResponse>("/invitations", {
    method: "GET",
  })
  return response.invitations
}

async function createInvitation(input: CreateInvitationInput): Promise<Invitation> {
  const response = await apiRequest<{ invitation: Invitation }>("/invitations", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return response.invitation
}

async function acceptInvitation(invitationId: string): Promise<void> {
  await apiRequest<{ message: string }>(`/invitations/${invitationId}`, {
    method: "POST",
    body: JSON.stringify({ action: "accept" }),
  })
}

async function rejectInvitation(invitationId: string): Promise<void> {
  await apiRequest<{ message: string }>(`/invitations/${invitationId}`, {
    method: "POST",
    body: JSON.stringify({ action: "reject" }),
  })
}

export const apiInvitationsService = {
  getPendingInvitations,
  createInvitation,
  acceptInvitation,
  rejectInvitation,
}
