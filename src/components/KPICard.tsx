import { motion } from "framer-motion";
import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent?: boolean;
}

export default function KPICard({ title, value, subtitle, icon, accent }: KPICardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.015, transition: { duration: 0.3, ease: "easeOut" } }}
      className={`rounded-3xl p-8 md:p-10 relative overflow-hidden group/kpi active-reflection-border active-reflection ${accent ? "glass-neon" : "glass"}`}
      data-active={accent ? "true" : "false"}
    >
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
      <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-700" />
      <div className="absolute -right-16 top-10 h-28 w-28 rounded-full border border-cyan-300/15 opacity-60 group-hover/kpi:scale-125 transition-transform duration-700" />
      <div className="flex flex-col h-full justify-between relative z-10 gap-8">

        <div className="flex justify-between items-start">
          <p className="text-xs md:text-sm font-black text-white/40 uppercase tracking-[0.2em] group-hover/kpi:text-white/80 transition-colors w-1/2 leading-tight">
            {title}
          </p>
          <div className={`rounded-full p-4 shadow-2xl transition-all duration-700 group-hover/kpi:scale-110 group-hover/kpi:rotate-12 ${accent ? "bg-primary text-black" : "bg-white/5 text-white/60 border border-white/10"}`}
            style={accent ? { boxShadow: "0 0 20px rgba(204,255,0,0.5)" } : {}}>
            {icon}
          </div>
        </div>

        <div>
          <p className={`text-5xl md:text-7xl font-black tracking-tighter ${accent ? "text-primary text-glow drop-shadow-[0_0_15px_rgba(204,255,0,0.5)]" : "text-white drop-shadow-md"} mix-blend-screen leading-none`}>
            {value}
          </p>
          {subtitle && (
            <div className="flex items-center gap-3 mt-4">
              <div className={`h-px w-8 ${accent ? "bg-primary" : "bg-white/20"}`}></div>
              <p className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-[0.2em]">{subtitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Extreme Decorative reflection */}
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-1000 pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-[50px] opacity-50 pointer-events-none" />
    </motion.div>
  );
}
