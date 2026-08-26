const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  isClientRoute?: boolean;
  params?: QueryParams;
  timeoutMs?: number;
};

type GetOptions = {
  isClientRoute?: boolean;
  params?: QueryParams;
  timeoutMs?: number;
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
  } = options;

  const tokenKey = isClientRoute
    ? "khairo_client_token"
    : "khairo_staff_token";

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(tokenKey)
      : null;

  const requestPath = addQueryParams(path, params);

  const controller =
    timeoutMs && timeoutMs > 0
      ? new AbortController()
      : null;

  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  const isFormData =
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${requestPath}`, {
      method,
      headers: {
        ...(body !== undefined && !isFormData
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token
          ? { Authorization: `Bearer ${token}` }
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
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(
          isClientRoute
            ? "client-auth:expired"
            : "staff-auth:expired"
        )
      );
    }

    throw new ApiError(getErrorMessage(data), res.status, data);
  }

  return data as T;
}

type DownloadOptions = {
  isClientRoute?: boolean;
  params?: QueryParams;
};

async function downloadRequest(
  path: string,
  options: DownloadOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const {
    isClientRoute = false,
    params,
  } = options;

  const tokenKey = isClientRoute
    ? "khairo_client_token"
    : "khairo_staff_token";

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(tokenKey)
      : null;

  const requestPath =
    addQueryParams(path, params);

  const res = await fetch(
    `${API_BASE_URL}${requestPath}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      },
    }
  );

  if (!res.ok) {
    const data: unknown =
      await res.json().catch(() => ({}));

    if (
      res.status === 401 &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(
        new CustomEvent(
          isClientRoute
            ? "client-auth:expired"
            : "staff-auth:expired"
        )
      );
    }

    throw new ApiError(
      getErrorMessage(data),
      res.status,
      data
    );
  }

  const disposition =
    res.headers.get(
      "content-disposition"
    ) || "";

  const filenameMatch =
    disposition.match(
      /filename="?([^";]+)"?/i
    );

  return {
    blob: await res.blob(),
    filename:
      filenameMatch?.[1] ||
      "download",
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
    isClientRoute = false
  ) =>
    request<T>(path, {
      method: "POST",
      body,
      isClientRoute,
    }),

  put: <T>(
    path: string,
    body?: unknown,
    isClientRoute = false
  ) =>
    request<T>(path, {
      method: "PUT",
      body,
      isClientRoute,
    }),

  patch: <T>(
    path: string,
    body?: unknown,
    isClientRoute = false
  ) =>
    request<T>(path, {
      method: "PATCH",
      body,
      isClientRoute,
    }),

  del: <T>(
    path: string,
    isClientRoute = false
  ) =>
    request<T>(path, {
      method: "DELETE",
      isClientRoute,
    }),

  download: (
    path: string,
    options: DownloadOptions = {}
  ) =>
    downloadRequest(
      path,
      options
    ),
};

export { ApiError };
