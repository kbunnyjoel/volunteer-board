import type { SignupRecord } from "../types";
import { buildUrl, parseError } from "./client";

export async function fetchSignups(token?: string): Promise<SignupRecord[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl("/api/signups"), {
    headers: Object.keys(headers).length ? headers : undefined
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

  const payload = (await response.json()) as SignupRecord[];
  return payload;
}
