const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "";

export function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function parseError(response: Response): Promise<string> {
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
