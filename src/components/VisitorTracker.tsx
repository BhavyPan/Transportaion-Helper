import { useEffect } from "react";
import { recordDailyVisit } from "@/lib/visitorAnalytics";
import { useAuth } from "@/context/AuthContext";

export default function VisitorTracker() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    recordDailyVisit(userId).catch((error) => {
      console.error("Failed to record daily visitor", error);
    });
  }, [userId]);

  return null;
}
