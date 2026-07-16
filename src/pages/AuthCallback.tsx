import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function redirectToLogin() {
  window.location.replace("/login?oauth=failed");
}

export default function AuthCallback() {
  useEffect(() => {
    const completeGoogleLogin = async () => {
      if (!supabase) {
        redirectToLogin();
        return;
      }

      const query = new URLSearchParams(window.location.search);
      if (query.get("error")) {
        redirectToLogin();
        return;
      }

      const code = query.get("code");
      const { data: existingSession } = await supabase.auth.getSession();

      if (!existingSession.session) {
        if (!code) {
          redirectToLogin();
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Google OAuth code exchange failed", error);
          redirectToLogin();
          return;
        }
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        console.error("Google OAuth session validation failed", error);
        redirectToLogin();
        return;
      }

      window.location.replace("/dashboard");
    };

    void completeGoogleLogin();
  }, []);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-black px-6 text-center text-white">
      <div>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
        <p className="mt-5 text-sm font-bold uppercase">Completing secure sign-in...</p>
      </div>
    </main>
  );
}
