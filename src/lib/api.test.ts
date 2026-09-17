import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, api } from "./api";

const jsonResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });

describe("api client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sends GET requests with cookies and encoded query parameters", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));

    await api.get("/clients", {
      params: {
        search: "Ada Lovelace",
        page: 2,
        active: true,
        ignored: null,
        missing: undefined,
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];

    expect(String(url)).toContain(
      "/clients?search=Ada+Lovelace&page=2&active=true"
    );
    expect(init).toMatchObject({
      method: "GET",
      credentials: "include",
    });
    expect(init?.headers).toEqual({});
    expect(init?.body).toBeUndefined();
  });

  it("appends query parameters to paths that already have a query string", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));

    await api.get("/clients?status=active", { params: { page: 3 } });

    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/clients?status=active&page=3"
    );
  });

  it("serializes JSON bodies for mutating requests", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await api.post("/clients", { name: "Test Client" });
    await api.put("/clients/1", { name: "Updated" });
    await api.patch("/clients/1", { status: "active" });
    await api.del("/clients/1");

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Client" }),
    });
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PUT");
    expect(fetchMock.mock.calls[2][1]?.method).toBe("PATCH");
    expect(fetchMock.mock.calls[3][1]?.method).toBe("DELETE");
    expect(fetchMock.mock.calls[3][1]?.headers).toEqual({});
  });

  it("does not set JSON headers or stringify FormData", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
    const formData = new FormData();
    formData.set("file", new Blob(["test"]), "test.txt");

    await api.post("/uploads", formData);

    const init = fetchMock.mock.calls[0][1];
    expect(init?.headers).toEqual({});
    expect(init?.body).toBe(formData);
  });

  it("returns parsed JSON on success", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, value: "ok" })
    );

    await expect(
      api.get<{ success: boolean; value: string }>("/health")
    ).resolves.toEqual({ success: true, value: "ok" });
  });

  it("throws ApiError with backend message and code", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          success: false,
          message: "Validation failed.",
          code: "VALIDATION_ERROR",
        },
        400
      )
    );

    const error = await api.get("/bad-request").catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
    });
  });

  it("falls back to a generic error message when the response has none", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));

    await expect(api.get("/broken")).rejects.toMatchObject({
      status: 500,
      message: "Something went wrong.",
    });
  });

  it("dispatches the staff expiry event after a staff 401", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "Session expired." }, 401)
    );
    const listener = vi.fn();
    window.addEventListener("staff-auth:expired", listener);

    await expect(api.get("/auth/me")).rejects.toBeInstanceOf(ApiError);

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("staff-auth:expired", listener);
  });

  it("dispatches the client expiry event after a client 401", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "Session expired." }, 401)
    );
    const listener = vi.fn();
    window.addEventListener("client-auth:expired", listener);

    await expect(api.get("/client-auth/me", true)).rejects.toBeInstanceOf(
      ApiError
    );

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("client-auth:expired", listener);
  });

  it("downloads files using cookie auth and returns the server filename", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("report contents", {
        status: 200,
        headers: {
          "content-disposition": 'attachment; filename="report.csv"',
        },
      })
    );

    const result = await api.download("/reports/export", {
      params: { month: "2026-09" },
    });

    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/reports/export?month=2026-09"
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "GET",
      credentials: "include",
    });
    expect(result.filename).toBe("report.csv");
    expect(await result.blob.text()).toBe("report contents");
  });

  it("uses a safe fallback filename when content-disposition is absent", async () => {
    fetchMock.mockResolvedValueOnce(new Response("data", { status: 200 }));

    const result = await api.download("/reports/export");

    expect(result.filename).toBe("download");
  });

  it("dispatches client expiry and throws when a client download returns 401", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "Please sign in." }, 401)
    );
    const listener = vi.fn();
    window.addEventListener("client-auth:expired", listener);

    await expect(
      api.download("/client-portal/report", { isClientRoute: true })
    ).rejects.toMatchObject({
      status: 401,
      message: "Please sign in.",
    });

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("client-auth:expired", listener);
  });

  it("aborts requests when the configured timeout expires", async () => {
    vi.useFakeTimers();

    fetchMock.mockImplementationOnce((_url, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    // Attach the rejection assertion before advancing fake timers so the abort
    // rejection is observed immediately rather than surfacing as an unhandled
    // promise rejection in Vitest/CI.
    const rejection = expect(
      api.get("/slow", { timeoutMs: 25 })
    ).rejects.toMatchObject({ name: "AbortError" });

    await vi.advanceTimersByTimeAsync(25);
    await rejection;
  });
});
