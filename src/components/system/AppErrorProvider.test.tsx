import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { APP_ERROR_EVENT } from "@/lib/appErrors";
import { AppErrorProvider, useAppError } from "./AppErrorProvider";

function HookTrigger() {
  const { notify } = useAppError();
  return (
    <button
      type="button"
      onClick={() =>
        notify({
          kind: "api",
          title: "Hook notification",
          message: "Sent through the provider context.",
        })
      }
    >
      Notify
    </button>
  );
}

function HookOutsideProvider() {
  useAppError();
  return null;
}

describe("AppErrorProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows app-level API errors to the user", () => {
    render(
      <AppErrorProvider>
        <div>App content</div>
      </AppErrorProvider>
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent(APP_ERROR_EVENT, {
          detail: {
            kind: "api",
            title: "Couldn’t save changes",
            message: "Please try again.",
            status: 409,
          },
        })
      );
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t save changes");
    expect(screen.getByRole("alert")).toHaveTextContent("Please try again.");
  });

  it("surfaces session expiry events", () => {
    render(
      <AppErrorProvider>
        <div>App content</div>
      </AppErrorProvider>
    );

    act(() => {
      window.dispatchEvent(new Event("staff-auth:expired"));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Session expired");
    expect(screen.getByRole("alert")).toHaveTextContent("Please sign in again");
  });

  it("allows notices to be dismissed", () => {
    render(
      <AppErrorProvider>
        <div>App content</div>
      </AppErrorProvider>
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent(APP_ERROR_EVENT, {
          detail: {
            kind: "network",
            title: "Can’t connect right now",
            message: "Check your connection.",
          },
        })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Dismiss message" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("deduplicates identical errors fired in quick succession", () => {
    render(
      <AppErrorProvider>
        <div>App content</div>
      </AppErrorProvider>
    );

    const event = () =>
      new CustomEvent(APP_ERROR_EVENT, {
        detail: {
          kind: "api" as const,
          title: "Something went wrong",
          message: "Please try again.",
          status: 500,
        },
      });

    act(() => {
      window.dispatchEvent(event());
      window.dispatchEvent(event());
    });

    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("supports explicit notifications through the provider hook", () => {
    render(
      <AppErrorProvider>
        <HookTrigger />
      </AppErrorProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Notify" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Hook notification");
  });

  it("rejects use of the error hook outside its provider", () => {
    expect(() => render(<HookOutsideProvider />)).toThrow(
      "useAppError must be used within AppErrorProvider"
    );
  });

  it("surfaces unhandled browser errors", () => {
    render(
      <AppErrorProvider>
        <div>App content</div>
      </AppErrorProvider>
    );

    act(() => {
      window.dispatchEvent(new Event("error"));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("alert")).toHaveTextContent("unexpected error");
  });

  it("surfaces unhandled promise rejections", () => {
    render(
      <AppErrorProvider>
        <div>App content</div>
      </AppErrorProvider>
    );

    act(() => {
      window.dispatchEvent(new Event("unhandledrejection"));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("automatically dismisses ordinary notices", async () => {
    vi.useFakeTimers();

    render(
      <AppErrorProvider>
        <div>App content</div>
      </AppErrorProvider>
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent(APP_ERROR_EVENT, {
          detail: {
            kind: "api",
            title: "Temporary notice",
            message: "This should disappear.",
          },
        })
      );
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
