import type { SignupRecord } from "../types";

export async function fetchSignups(token?: string): Promise<SignupRecord[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("/api/signups", {
    headers: Object.keys(headers).length ? headers : undefined
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error("Unauthorized");
      (error as Error & { code?: string }).code = "UNAUTHORIZED";
      throw error;
    }
    throw new Error("Failed to load signups");
  }

  const payload = (await response.json()) as SignupRecord[];
  return payload;
}
