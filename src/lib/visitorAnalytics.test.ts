import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAnonymousVisitorId,
  recordDailyVisit,
  recordVisitOncePerSession,
} from "./visitorAnalytics";

const successfulResponse = {
  ok: true,
  json: async () => ({
    success: true,
    message: "Visit recorded",
    date: "2026-07-17",
    newExactVisitor: true,
  }),
};

describe("visitor analytics identity", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("reuses one anonymous UUID across refresh-style calls", () => {
    const firstId = getAnonymousVisitorId();
    const secondId = getAnonymousVisitorId();

    expect(secondId).toBe(firstId);
    expect(firstId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("sends the same anonymous identity on repeated records", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(successfulResponse as unknown as Response);

    const visitorId = `anonymous:${getAnonymousVisitorId()}`;

    await recordDailyVisit(visitorId);
    await recordDailyVisit(visitorId);

    const firstRequest = fetchMock.mock.calls[0][1] as RequestInit;
    const secondRequest = fetchMock.mock.calls[1][1] as RequestInit;

    expect(firstRequest.body).toBe(secondRequest.body);
  });

  it("sends a prefixed Supabase user ID for an authenticated visitor", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(successfulResponse as unknown as Response);

    await recordDailyVisit("user:verified-supabase-user-id");

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(request.body as string)).toEqual({
      visitorId: "user:verified-supabase-user-id",
    });
  });

  it("records an identity only once during the same browser session", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(successfulResponse as unknown as Response);

    await recordVisitOncePerSession("user:session-user");
    await recordVisitOncePerSession("user:session-user");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
