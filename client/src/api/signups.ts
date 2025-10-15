import type { PaginatedResponse, SignupRecord } from "../types";
import { buildUrl, parseError } from "./client";

type FetchSignupsOptions = {
  page?: number;
  perPage?: number;
  opportunityId?: string;
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

export async function fetchSignups(
  token: string | undefined,
  options: FetchSignupsOptions = {}
): Promise<PaginatedResponse<SignupRecord>> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const query = buildQueryString({
    page: options.page,
    perPage: options.perPage,
    opportunityId: options.opportunityId
  });

  const response = await fetch(buildUrl(`/api/signups${query}`), {
    headers: Object.keys(headers).length ? headers : undefined,
    signal: options.signal
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error("Unauthorized");
      (error as Error & { code?: string }).code = "UNAUTHORIZED";
      throw error;
    }
    const message = await parseError(response);
    throw new Error(message || "Failed to load signups");
  }

  const payload = (await response.json()) as
    | PaginatedResponse<SignupRecord>
    | SignupRecord[];

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
