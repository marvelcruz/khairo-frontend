export const APP_ERROR_EVENT = "khairo:app-error";

export type AppErrorKind =
  | "api"
  | "network"
  | "timeout"
  | "session"
  | "unexpected";

export type AppErrorDetail = {
  kind: AppErrorKind;
  title: string;
  message: string;
  status?: number;
  code?: string;
  source?: string;
};

export function dispatchAppError(detail: AppErrorDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AppErrorDetail>(APP_ERROR_EVENT, { detail }));
}

export function apiErrorDetail({
  status,
  message,
  code,
  source,
}: {
  status: number;
  message?: string;
  code?: string;
  source?: string;
}): AppErrorDetail {
  if (status === 403) {
    return {
      kind: "api",
      title: "Action not allowed",
      message: "You don’t have permission to do that.",
      status,
      code,
      source,
    };
  }

  if (status === 404) {
    return {
      kind: "api",
      title: "Not found",
      message: message || "The requested item could not be found.",
      status,
      code,
      source,
    };
  }

  if (status === 409) {
    return {
      kind: "api",
      title: "Couldn’t save changes",
      message: message || "The data changed before this request completed. Please try again.",
      status,
      code,
      source,
    };
  }

  if (status === 429) {
    return {
      kind: "api",
      title: "Too many requests",
      message: message || "Please wait a moment and try again.",
      status,
      code,
      source,
    };
  }

  if (status >= 500) {
    return {
      kind: "api",
      title: "Something went wrong",
      message: "KhairoDietClinic couldn’t complete that request. Please try again.",
      status,
      code,
      source,
    };
  }

  return {
    kind: "api",
    title: "Request couldn’t be completed",
    message: message || "Please check the information and try again.",
    status,
    code,
    source,
  };
}

export function networkErrorDetail(source?: string): AppErrorDetail {
  return {
    kind: "network",
    title: "Can’t connect right now",
    message: "KhairoDietClinic couldn’t reach the server. Check your connection and try again.",
    source,
  };
}

export function timeoutErrorDetail(source?: string): AppErrorDetail {
  return {
    kind: "timeout",
    title: "Request timed out",
    message: "The server took too long to respond. Please try again.",
    source,
  };
}
