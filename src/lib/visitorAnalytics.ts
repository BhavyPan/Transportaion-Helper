const visitorApiBaseUrl = (
  import.meta.env.VITE_ANALYTICS_API_URL || "/visitor-api"
).replace(/\/$/, "");

const anonymousVisitorStorageKey = "transportation_helper_visitor_id";
const recordedVisitSessionPrefix = "transportation_helper_visit_recorded";
const pendingGoogleLoginKey = "transportation_helper_google_login_pending";
const pendingVisitorIds = new Set<string>();
const anonymousIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface DailyVisitorStats {
  date: string;
  allTimeUniqueVisitors: number;
  allTimeReturningLoggedInVisitors: number;
  totalUniqueVisitors: number;
  loggedInUniqueVisitors: number;
  returningLoggedInVisitors: number;
  estimatedUniqueVisitors: number;
  exactUniqueVisitors: number;
  difference: number;
  errorPercentage: number;
}

export interface RecordedDailyVisit {
  success: true;
  message: string;
  date: string;
  newExactVisitor: boolean;
}

async function requestVisitorApi<T>(
  path: string,
  options?: RequestInit,
  errorMessage = "Visitor analytics is unavailable",
) {
  const response = await fetch(`${visitorApiBaseUrl}${path}`, options);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export function getAnonymousVisitorId() {
  const storedVisitorId = localStorage.getItem(anonymousVisitorStorageKey);

  if (storedVisitorId && anonymousIdPattern.test(storedVisitorId)) {
    return storedVisitorId;
  }

  const visitorId = crypto.randomUUID();
  localStorage.setItem(anonymousVisitorStorageKey, visitorId);
  return visitorId;
}

export async function recordDailyVisit(visitorId: string) {
  return requestVisitorApi<RecordedDailyVisit>(
    "/api/analytics/visit",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ visitorId }),
    },
    "Unable to record visitor",
  );
}

export async function recordSuccessfulLogin(userId: string) {
  return requestVisitorApi<RecordedDailyVisit>(
    "/api/analytics/visit",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitorId: `user:${userId}`,
        loginEvent: true,
      }),
      keepalive: true,
    },
    "Unable to record login analytics",
  );
}

export function markGoogleLoginPending() {
  sessionStorage.setItem(pendingGoogleLoginKey, "true");
}

export function clearPendingGoogleLogin() {
  sessionStorage.removeItem(pendingGoogleLoginKey);
}

export function consumePendingGoogleLogin() {
  const isPending = sessionStorage.getItem(pendingGoogleLoginKey) === "true";
  clearPendingGoogleLogin();
  return isPending;
}

export async function recordVisitOncePerSession(visitorId: string) {
  const sessionKey = `${recordedVisitSessionPrefix}:${visitorId}`;

  if (sessionStorage.getItem(sessionKey) || pendingVisitorIds.has(visitorId)) {
    return null;
  }

  pendingVisitorIds.add(visitorId);

  try {
    const result = await recordDailyVisit(visitorId);
    sessionStorage.setItem(sessionKey, "true");
    return result;
  } finally {
    pendingVisitorIds.delete(visitorId);
  }
}

export async function fetchTodayVisitorStats() {
  return requestVisitorApi<DailyVisitorStats>("/api/analytics/daily");
}
