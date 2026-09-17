import {
  apiErrorDetail,
  dispatchAppError,
  networkErrorDetail,
  timeoutErrorDetail,
} from "./appErrors";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://khairo-backend.onrender.com/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

type ErrorHandlingOptions = {
  isClientRoute?: boolean;
  timeoutMs?: number;
  suppressGlobalError?: boolean;
  suppressAuthExpired?: boolean;
};

type RequestOptions = ErrorHandlingOptions & {
  method?: HttpMethod;
  body?: unknown;
  params?: QueryParams;
};

type GetOptions = ErrorHandlingOptions & {
  params?: QueryParams;
};

type MutationOptions = ErrorHandlingOptions;

type DownloadOptions = Pick<
  ErrorHandlingOptions,
  "isClientRoute" | "suppressGlobalError" | "suppressAuthExpired"
> & {
  params?: QueryParams;
};

class ApiError extends Error {
  status: number;
  data: unknown;
  code?: string;

  constructor(message: string, status: number, data: unknown = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;

    if (
      typeof data === "object" &&
      data !== null &&
      "code" in data &&
      typeof (data as { code?: unknown }).code === "string"
    ) {
      this.code = (data as { code: string }).code;
    }
  }
}

function addQueryParams(path: string, params?: QueryParams): string {
  if (!params) return path;

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  if (!query) return path;

  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

function getErrorMessage(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message?: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }

  return "Something went wrong.";
}

function normalizeMutationOptions(
  optionsOrClientRoute: boolean | MutationOptions = false
): MutationOptions {
  return typeof optionsOrClientRoute === "boolean"
    ? { isClientRoute: optionsOrClientRoute }
    : optionsOrClientRoute;
}

function dispatchAuthExpired(isClientRoute: boolean) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(
      isClientRoute ? "client-auth:expired" : "staff-auth:expired"
    )
  );
}

function reportTransportError({
  error,
  source,
  suppressGlobalError,
}: {
  error: unknown;
  source: string;
  suppressGlobalError: boolean;
}) {
  const timedOut =
    error instanceof DOMException && error.name === "AbortError";

  const apiError = new ApiError(
    timedOut ? "Request timed out." : "Unable to reach the server.",
    0,
    {
      code: timedOut ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
    }
  );

  if (!suppressGlobalError) {
    dispatchAppError(
      timedOut ? timeoutErrorDetail(source) : networkErrorDetail(source)
    );
  }

  return apiError;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    isClientRoute = false,
    params,
    timeoutMs,
    suppressGlobalError = false,
    suppressAuthExpired = false,
  } = options;

  const requestPath = addQueryParams(path, params);

  const controller =
    timeoutMs && timeoutMs > 0 ? new AbortController() : null;

  const timeoutId = controller
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${requestPath}`, {
      method,
      headers: {
        ...(body !== undefined && !isFormData
          ? { "Content-Type": "application/json" }
          : {}),
      },
      credentials: "include",
      body:
        body !== undefined
          ? isFormData
            ? body
            : JSON.stringify(body)
          : undefined,
      signal: controller?.signal,
    });
  } catch (error) {
    throw reportTransportError({
      error,
      source: `${method} ${path}`,
      suppressGlobalError,
    });
  } finally {
    if (timeoutId !== null) {
      globalThis.clearTimeout(timeoutId);
    }
  }

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new ApiError(getErrorMessage(data), res.status, data);

    if (res.status === 401) {
      if (!suppressAuthExpired) dispatchAuthExpired(isClientRoute);
    } else if (!suppressGlobalError) {
      dispatchAppError(
        apiErrorDetail({
          status: res.status,
          message: error.message,
          code: error.code,
          source: `${method} ${path}`,
        })
      );
    }

    throw error;
  }

  return data as T;
}

async function downloadRequest(
  path: string,
  options: DownloadOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const {
    isClientRoute = false,
    params,
    suppressGlobalError = false,
    suppressAuthExpired = false,
  } = options;

  const requestPath = addQueryParams(path, params);

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${requestPath}`, {
      method: "GET",
      credentials: "include",
    });
  } catch (error) {
    throw reportTransportError({
      error,
      source: `DOWNLOAD ${path}`,
      suppressGlobalError,
    });
  }

  if (!res.ok) {
    const data: unknown = await res.json().catch(() => ({}));
    const error = new ApiError(getErrorMessage(data), res.status, data);

    if (res.status === 401) {
      if (!suppressAuthExpired) dispatchAuthExpired(isClientRoute);
    } else if (!suppressGlobalError) {
      dispatchAppError(
        apiErrorDetail({
          status: res.status,
          message: error.message,
          code: error.code,
          source: `DOWNLOAD ${path}`,
        })
      );
    }

    throw error;
  }

  const disposition = res.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);

  return {
    blob: await res.blob(),
    filename: filenameMatch?.[1] || "download",
  };
}

export const api = {
  get: <T>(
    path: string,
    optionsOrClientRoute: boolean | GetOptions = false
  ) => {
    const options: GetOptions =
      typeof optionsOrClientRoute === "boolean"
        ? { isClientRoute: optionsOrClientRoute }
        : optionsOrClientRoute;

    return request<T>(path, {
      method: "GET",
      ...options,
    });
  },

  post: <T>(
    path: string,
    body?: unknown,
    optionsOrClientRoute: boolean | MutationOptions = false
  ) =>
    request<T>(path, {
      method: "POST",
      body,
      ...normalizeMutationOptions(optionsOrClientRoute),
    }),

  put: <T>(
    path: string,
    body?: unknown,
    optionsOrClientRoute: boolean | MutationOptions = false
  ) =>
    request<T>(path, {
      method: "PUT",
      body,
      ...normalizeMutationOptions(optionsOrClientRoute),
    }),

  patch: <T>(
    path: string,
    body?: unknown,
    optionsOrClientRoute: boolean | MutationOptions = false
  ) =>
    request<T>(path, {
      method: "PATCH",
      body,
      ...normalizeMutationOptions(optionsOrClientRoute),
    }),

  del: <T>(
    path: string,
    optionsOrClientRoute: boolean | MutationOptions = false
  ) =>
    request<T>(path, {
      method: "DELETE",
      ...normalizeMutationOptions(optionsOrClientRoute),
    }),

  download: (
    path: string,
    options: DownloadOptions = {}
  ) => downloadRequest(path, options),
};

export { ApiError };
