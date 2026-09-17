import { describe, expect, it, vi } from "vitest";

import {
  APP_ERROR_EVENT,
  apiErrorDetail,
  dispatchAppError,
  networkErrorDetail,
  timeoutErrorDetail,
  type AppErrorDetail,
} from "./appErrors";

describe("app error helpers", () => {
  it("dispatches structured app errors", () => {
    const listener = vi.fn<(event: Event) => void>();
    window.addEventListener(APP_ERROR_EVENT, listener);

    dispatchAppError({
      kind: "api",
      title: "Could not save",
      message: "Try again.",
      status: 409,
      code: "CONFLICT",
    });

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent<AppErrorDetail>;
    expect(event.detail).toMatchObject({
      kind: "api",
      status: 409,
      code: "CONFLICT",
    });

    window.removeEventListener(APP_ERROR_EVENT, listener);
  });

  it("maps forbidden errors to a permission-safe message", () => {
    expect(apiErrorDetail({ status: 403, message: "internal ACL detail" })).toEqual({
      kind: "api",
      title: "Action not allowed",
      message: "You don’t have permission to do that.",
      status: 403,
      code: undefined,
      source: undefined,
    });
  });

  it("maps not-found errors and preserves a useful backend message", () => {
    expect(
      apiErrorDetail({
        status: 404,
        message: "Client record was not found.",
        source: "GET /clients/123",
      })
    ).toMatchObject({
      title: "Not found",
      message: "Client record was not found.",
      status: 404,
      source: "GET /clients/123",
    });

    expect(apiErrorDetail({ status: 404 }).message).toBe(
      "The requested item could not be found."
    );
  });

  it("maps conflicts with custom and fallback messages", () => {
    expect(apiErrorDetail({ status: 409, message: "Record changed." }).message).toBe(
      "Record changed."
    );
    expect(apiErrorDetail({ status: 409 }).message).toBe(
      "The data changed before this request completed. Please try again."
    );
  });

  it("maps rate limits with custom and fallback messages", () => {
    expect(apiErrorDetail({ status: 429, message: "Wait 15 minutes." }).message).toBe(
      "Wait 15 minutes."
    );
    expect(apiErrorDetail({ status: 429 }).message).toBe(
      "Please wait a moment and try again."
    );
  });

  it("never exposes raw 5xx messages to the user", () => {
    const detail = apiErrorDetail({
      status: 503,
      message: "MongoServerSelectionError mongodb://private-host",
      code: "DB_DOWN",
      source: "GET /reports",
    });

    expect(detail).toEqual({
      kind: "api",
      title: "Something went wrong",
      message: "KhairoDietClinic couldn’t complete that request. Please try again.",
      status: 503,
      code: "DB_DOWN",
      source: "GET /reports",
    });
    expect(detail.message).not.toContain("Mongo");
  });

  it("maps ordinary request failures with custom and fallback messages", () => {
    expect(apiErrorDetail({ status: 400, message: "Email is required." }).message).toBe(
      "Email is required."
    );
    expect(apiErrorDetail({ status: 422 }).message).toBe(
      "Please check the information and try again."
    );
  });

  it("builds consistent network and timeout messages", () => {
    expect(networkErrorDetail("GET /clients")).toEqual({
      kind: "network",
      title: "Can’t connect right now",
      message: "KhairoDietClinic couldn’t reach the server. Check your connection and try again.",
      source: "GET /clients",
    });

    expect(timeoutErrorDetail("POST /reports")).toEqual({
      kind: "timeout",
      title: "Request timed out",
      message: "The server took too long to respond. Please try again.",
      source: "POST /reports",
    });
  });
});
