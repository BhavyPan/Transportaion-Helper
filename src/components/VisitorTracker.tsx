import { useEffect } from "react";
import {
  getAnonymousVisitorId,
  recordVisitOncePerSession,
} from "@/lib/visitorAnalytics";
import { useAuth } from "@/context/AuthContext";

export default function VisitorTracker() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    const visitorId = userId
      ? `user:${userId}`
      : `anonymous:${getAnonymousVisitorId()}`;

    recordVisitOncePerSession(visitorId).catch((error) => {
      console.error("Visitor analytics error:", error);
    });
  }, [userId]);

  return null;
}
