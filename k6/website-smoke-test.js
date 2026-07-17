import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (
  __ENV.BASE_URL || "https://transportaion-helper.vercel.app"
).replace(/\/$/, "");

export const options = {
  scenarios: {
    website_smoke: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 2),
      duration: __ENV.DURATION || "30s",
      gracefulStop: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
    "http_req_duration{page:home}": ["p(95)<1500"],
    "http_req_duration{page:analytics}": ["p(95)<2000"],
  },
};

export default function () {
  const responses = http.batch([
    ["GET", `${baseUrl}/`, null, { tags: { page: "home" } }],
    ["GET", `${baseUrl}/analytics`, null, { tags: { page: "analytics" } }],
  ]);

  check(responses[0], {
    "homepage returns HTTP 200": (response) => response.status === 200,
  });

  check(responses[1], {
    "analytics page returns HTTP 200": (response) => response.status === 200,
  });

  sleep(1);
}
