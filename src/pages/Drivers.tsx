import { motion } from "framer-motion";
import { useFleet } from "@/context/FleetContext";
import { DriverStatusBadge } from "@/components/StatusBadge";
import { Shield, AlertCircle } from "lucide-react";

export default function Drivers() {
  const { drivers } = useFleet();
  const now = new Date();
  const isExpired = (date: string) => new Date(date) < new Date();
  const isExpiringSoon = (date: string) => {
    const d = new Date(date);
    const diff = d.getTime() - now.getTime();
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="pb-40 cursor-none">
      {/* Mini Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="pt-12 pb-20 px-4 md:px-8 text-center relative"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px w-12 bg-primary hidden md:block"></div>
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-sm text-glow">Personnel Database</p>
          <div className="h-px w-12 bg-primary hidden md:block"></div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter text-glow">
          Driver Profiles
        </h1>
        <p className="mt-4 text-white/50 text-xs md:text-sm font-bold tracking-widest uppercase max-w-xl mx-auto">
          Performance, compliance, and safety management for all licensed operators.
        </p>
      </motion.div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {drivers.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 6) * 0.1, duration: 0.6, ease: "easeOut" }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="rounded-[3rem] border border-white/5 glass p-8 md:p-10 space-y-8 active-reflection-border group relative overflow-hidden cursor-none"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter text-glow mb-1">{d.name}</h3>
                  <p className="text-xs text-primary/80 font-mono tracking-widest uppercase">{d.phone}</p>
                </div>
                <div className="scale-110 origin-top-right">
                  <DriverStatusBadge status={d.status} />
                </div>
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className={`h-5 w-5 ${d.safetyScore >= 80 ? "text-success" : d.safetyScore >= 60 ? "text-warning" : "text-destructive"}`} />
                    <span className="text-white/60 text-xs uppercase tracking-widest font-bold">Safety Rating</span>
                  </div>
                  <span className="font-black text-white tracking-tighter text-3xl text-glow leading-none">{d.safetyScore}<span className="text-white/40 text-sm tracking-widest inline-block ml-1">/100</span></span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${d.safetyScore}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className={`h-full rounded-full transition-all ${d.safetyScore >= 80 ? "bg-success shadow-[0_0_15px_#10b981]" : d.safetyScore >= 60 ? "bg-warning" : "bg-destructive"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-2">Trips Completed</p>
                  <p className="font-black text-white text-4xl tracking-tighter text-glow">{d.tripsCompleted}</p>
                </div>
                <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-2">License Class</p>
                  <p className="font-bold text-white/80 mt-0.5 tracking-widest text-sm uppercase">{d.licenseCategories.join(", ")}</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 text-xs rounded-2xl p-5 border relative z-10 ${isExpired(d.licenseExpiry) ? "bg-destructive/10 text-destructive border-destructive/20" :
                isExpiringSoon(d.licenseExpiry) ? "bg-warning/10 text-warning border-warning/20" :
                  "bg-success/10 text-success border-success/20"
                }`}>
                {(isExpired(d.licenseExpiry) || isExpiringSoon(d.licenseExpiry)) && (
                  <div className="bg-background rounded-full p-2 shadow-lg">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                )}
                {!isExpired(d.licenseExpiry) && !isExpiringSoon(d.licenseExpiry) && (
                  <div className="bg-background rounded-full p-2 shadow-lg">
                    <Shield className="h-4 w-4" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-bold uppercase tracking-widest text-[10px] opacity-80">
                    License Expiry
                  </span>
                  <span className="font-mono text-sm tracking-widest mt-1 font-bold">
                    {new Date(d.licenseExpiry).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
