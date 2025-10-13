import type {
  Opportunity,
  OpportunityInput,
  OpportunityUpdateInput,
  SignupPayload,
  SignupResponse
} from "../types";
import { buildUrl, parseError } from "./client";

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const response = await fetch(buildUrl("/api/opportunities"));
  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message || "Failed to load opportunities");
  }

  const payload = (await response.json()) as Opportunity[];
  return payload;
}

export async function submitSignup(
  payload: SignupPayload
): Promise<SignupResponse> {
  const response = await fetch(
    buildUrl(`/api/opportunities/${payload.opportunityId}/signups`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message || "Failed to submit signup");
  }

  return (await response.json()) as SignupResponse;
}

export async function createOpportunity(
  token: string,
  payload: OpportunityInput
): Promise<Opportunity> {
  const response = await fetch(buildUrl("/api/opportunities"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message || "Failed to create opportunity");
  }

  return (await response.json()) as Opportunity;
}

export async function updateOpportunity(
  token: string,
  id: string,
  payload: OpportunityUpdateInput
): Promise<Opportunity> {
  const response = await fetch(buildUrl(`/api/opportunities/${id}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message || "Failed to update opportunity");
  }

  return (await response.json()) as Opportunity;
}

export async function deleteOpportunity(
  token: string,
  id: string
): Promise<void> {
  const response = await fetch(buildUrl(`/api/opportunities/${id}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message || "Failed to archive opportunity");
  }
}
