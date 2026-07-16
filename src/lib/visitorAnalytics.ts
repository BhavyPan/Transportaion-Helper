const visitorApiBaseUrl = (
  import.meta.env.VITE_VISITOR_API_URL || "/visitor-api"
).replace(/\/$/, "");

export interface DailyVisitorStats {
  success: true;
  date: string;
  estimatedUniqueVisitors: number;
  exactUniqueVisitors: number;
  difference: number;
  errorPercentage: number;
}

async function requestVisitorApi<T>(path: string, options?: RequestInit) {
  const response = await fetch(`${visitorApiBaseUrl}${path}`, options);

  if (!response.ok) {
    throw new Error(`Visitor API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function recordDailyVisit(visitorId: string) {
  return requestVisitorApi<{ success: true; message: string; date: string }>(
    "/api/visits",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ visitorId: `user:${visitorId}` }),
    },
  );
}

export async function fetchTodayVisitorStats() {
  return requestVisitorApi<DailyVisitorStats>("/api/stats/today");
}
