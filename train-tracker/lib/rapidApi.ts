export const DEFAULT_RAPID_HOST = "irctc1.p.rapidapi.com";

export class RapidApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "RapidApiError";
    this.status = status;
  }
}

interface RapidApiRequest {
  defaultPath: string;
  envUrlKey?: string;
  query?: Record<string, string | number | undefined | null>;
  method?: "GET" | "POST";
  body?: unknown;
  errorMessages?: Partial<Record<number, string>> & { default?: string };
}

function buildEndpoint(defaultPath: string, host: string, envOverride?: string): URL {
  if (envOverride) {
    return new URL(envOverride);
  }

  if (defaultPath.startsWith("http")) {
    return new URL(defaultPath);
  }

  return new URL(`https://${host}${defaultPath}`);
}

export async function requestRapidApi<T = any>({
  defaultPath,
  envUrlKey,
  query = {},
  method = "GET",
  body,
  errorMessages = {
    default: "Unable to reach the live rail data service"
  }
}: RapidApiRequest): Promise<T> {
  const rapidKey = process.env.RAPIDAPI_KEY;
  if (!rapidKey) {
    throw new RapidApiError(503, "Live data is temporarily unavailable");
  }

  const rapidHost = process.env.RAPIDAPI_HOST ?? DEFAULT_RAPID_HOST;
  const upstreamUrl = buildEndpoint(defaultPath, rapidHost, envUrlKey ? process.env[envUrlKey] : undefined);

  Object.entries(query).forEach(([param, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const stringified = `${value}`.trim();
    if (stringified.length > 0) {
      upstreamUrl.searchParams.set(param, stringified);
    }
  });

  const headers: Record<string, string> = {
    "X-RapidAPI-Key": rapidKey,
    "X-RapidAPI-Host": rapidHost
  };

  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(upstreamUrl, {
    method,
    headers,
    cache: "no-store",
    body: method === "GET" ? undefined : JSON.stringify(body ?? {})
  });

  if (!response.ok) {
    const fallbackMessage =
      errorMessages[response.status] ??
      errorMessages.default ??
      "Unable to fetch live rail data";
    throw new RapidApiError(response.status, fallbackMessage);
  }

  return (await response.json()) as T;
}
