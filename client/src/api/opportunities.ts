import type {
  Opportunity,
  OpportunityInput,
  OpportunityUpdateInput,
  SignupPayload,
  SignupResponse,
  PaginatedResponse
} from "../types";
import { buildUrl, parseError } from "./client";

type FetchOpportunitiesOptions = {
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
};

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

export async function fetchOpportunities(
  options: FetchOpportunitiesOptions = {}
): Promise<PaginatedResponse<Opportunity>> {
  const query = buildQueryString({
    page: options.page,
    perPage: options.perPage
  });
  const response = await fetch(buildUrl(`/api/opportunities${query}`), {
    signal: options.signal
  });
  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message || "Failed to load opportunities");
  }

  const payload = (await response.json()) as
    | PaginatedResponse<Opportunity>
    | Opportunity[];

  if (Array.isArray(payload)) {
    return {
      items: payload,
      page: 1,
      perPage: payload.length,
      totalItems: payload.length,
      totalPages: 1,
      hasMore: false,
      nextPage: null
    };
  }

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
