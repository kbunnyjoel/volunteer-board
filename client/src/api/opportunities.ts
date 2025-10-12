import type {
  Opportunity,
  OpportunityInput,
  OpportunityUpdateInput,
  SignupPayload,
  SignupResponse
} from "../types";

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.clone().json()) as { error?: unknown };
    if (!data || typeof data !== "object") return response.statusText;
    if (typeof (data as { error?: string }).error === "string") {
      return (data as { error: string }).error;
    }

    if (
      typeof (data as { error?: { message?: string } }).error === "object" &&
      (data as { error: { message?: string } }).error?.message
    ) {
      return (data as { error: { message: string } }).error.message;
    }

    return response.statusText;
  } catch (error) {
    console.debug("Unable to parse error payload", error);
    return response.statusText;
  }
}

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const response = await fetch("/api/opportunities");
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
    `/api/opportunities/${payload.opportunityId}/signups`,
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
  const response = await fetch("/api/opportunities", {
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
  const response = await fetch(`/api/opportunities/${id}`, {
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
  const response = await fetch(`/api/opportunities/${id}`, {
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
