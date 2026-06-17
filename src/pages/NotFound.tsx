import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] height-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="text-center relative z-10 glass active-reflection-border p-12 rounded-2xl border border-white/10">
        <h1 className="mb-4 text-6xl font-black text-primary text-glow tracking-tighter">404</h1>
        <p className="mb-8 text-xl text-white uppercase tracking-widest">System Offline: Page not found</p>
        <a href="/" className="inline-flex items-center justify-center rounded-md bg-primary text-black px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-primary/90 shadow-[0_0_15px_#ccff004d] transition-all">
          Return to Command Center
        </a>
      </div>
    </div>
  );
};

export default NotFound;
