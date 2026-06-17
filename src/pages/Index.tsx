import { motion, useScroll, useTransform } from "framer-motion";
import {
  Truck,
  AlertTriangle,
  Activity,
  Package,
  TrendingUp,
  Clock,
  ChevronRight,
  ArrowDown,
  ShieldCheck,
  Users,
  Gauge,
  MapPinned,
  BarChart3,
  Route,
  Radar,
  Sparkles,
} from "lucide-react";
import KPICard from "@/components/KPICard";
import { useFleet } from "@/context/FleetContext";
import { VehicleStatusBadge, TripStatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { EmptySpaceHologram } from "@/components/EmptySpaceHologram";

export default function Dashboard() {
  const { vehicles, trips, drivers } = useFleet();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 50]);

  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || "Unknown";
  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name || "Unknown";

  const activeFleet = vehicles.filter(v => v.status === "On Trip").length;
  const inShop = vehicles.filter(v => v.status === "In Shop").length;
  const available = vehicles.filter(v => v.status === "Available").length;
  const utilization = Math.round((activeFleet / vehicles.filter(v => v.status !== "Retired").length) * 100) || 0;
  const pendingTrips = trips.filter(t => t.status === "Draft").length;
  const activeDrivers = drivers.filter(d => d.status === "On Duty" || d.status === "On Trip").length;

  const recentTrips = [...trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const fleetHealth = Math.round(((available + activeFleet) / vehicles.length) * 100) || 0;
  const completedTrips = trips.filter(t => t.status === "Completed").length;
  const inProgressTrips = trips.filter(t => t.status === "In Progress").length;
  const roleCards = [
    { role: "Manager", metric: `${utilization}%`, label: "utilization", icon: ShieldCheck },
    { role: "Dispatcher", metric: activeFleet, label: "active routes", icon: Route },
    { role: "Safety Officer", metric: inShop, label: "shop alerts", icon: AlertTriangle },
    { role: "Finance", metric: completedTrips, label: "closed jobs", icon: BarChart3 },
  ];
  const featureCards = [
    { title: "Route Intelligence", body: "Live route state, origin-destination flow, and dispatch visibility stay above the moving map.", icon: MapPinned },
    { title: "Fleet Readiness", body: "Vehicle status, maintenance pressure, and available capacity are separated into scan-friendly panels.", icon: Gauge },
    { title: "Operator Control", body: "Role-aware navigation remains intact while the landing surface becomes lighter and spatial.", icon: Users },
  ];

  return (
    <div ref={containerRef} className="landing-scroll relative z-20 cursor-none pb-24">

      {/* Premium Hero Section */}
      <motion.div
        className="landing-slide min-h-[calc(100dvh-5rem)] px-4 pt-12 md:px-8 lg:pt-16"
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      >
        <motion.div
          initial={{ opacity: 0, y: 48, filter: "blur(18px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto grid min-h-[72dvh] w-full max-w-[1500px] items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.75fr)]"
        >
          <div className="landing-glass active-reflection-border relative z-20 max-w-3xl rounded-[1.5rem] p-6 md:p-9 lg:p-11">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary text-glow">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(204,255,0,0.95)]" />
              Live Telemetry Active
            </div>

            <h1 className="text-white font-black uppercase leading-[0.9] text-glow mix-blend-screen" style={{ fontSize: "clamp(3.2rem, 8vw, 8.5rem)" }}>
              FleetFlow<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/25">Command</span>
            </h1>

            <p className="mt-7 max-w-2xl text-sm font-bold uppercase leading-relaxed tracking-[0.14em] text-white/[0.66] md:text-base">
              Real-time trajectory tracking, global logistics coordination, and fleet operations control over a live futuristic network.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="button-glow h-12 rounded-full bg-primary px-7 text-xs font-black uppercase tracking-[0.16em] text-black hover:bg-primary/90">
                <Link to="/trips">Open Dispatch</Link>
              </Button>
              <Button asChild variant="outline" className="button-glow h-12 rounded-full border-white/[0.18] bg-white/[0.06] px-7 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-white/10 hover:text-primary">
                <Link to="/vehicles">View Fleet</Link>
              </Button>
            </div>

            <div className="mt-9 grid grid-cols-3 gap-3">
              {[
                ["Active", activeFleet],
                ["Health", `${fleetHealth}%`],
                ["Drivers", activeDrivers],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/[0.18] p-4 backdrop-blur-md">
                  <div className="text-2xl font-black text-white md:text-3xl">{value}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/[0.42]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 hidden min-h-[520px] items-center justify-center lg:flex" aria-hidden="true">
            <motion.div
              className="absolute h-[34rem] w-[34rem] rounded-full border border-primary/[0.16] bg-primary/5 blur-[1px]"
              animate={{ rotate: 360, scale: [1, 1.04, 1] }}
              transition={{ rotate: { duration: 28, repeat: Infinity, ease: "linear" }, scale: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
            />
            <motion.div
              className="landing-glass absolute right-8 top-20 rounded-2xl px-5 py-4"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-3">
                <Radar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Network Pulse</p>
                  <p className="text-lg font-black text-white">{inProgressTrips + activeFleet} live signals</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="landing-glass absolute bottom-24 left-0 rounded-2xl px-5 py-4"
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Cargo Layer</p>
                  <p className="text-lg font-black text-white">{pendingTrips} pending loads</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 text-white/[0.32]"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Scroll to initialize</span>
          <ArrowDown className="h-6 w-6 text-primary drop-shadow-[0_0_10px_rgba(204,255,0,0.8)]" />
        </motion.div>
      </motion.div>

      <div className="relative z-20 mx-auto max-w-[1600px] px-4 md:px-8">

        {/* Fleet Overview Highlight */}
        <motion.div
          className="landing-slide grid items-center gap-8 lg:grid-cols-[0.68fr_1fr]"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.8, staggerChildren: 0.1 }}
        >
          <EmptySpaceHologram
            variant="overview"
            className="hidden lg:block left-0 top-24 h-[62%] w-[46%] opacity-60"
          />
          <div className="landing-copy-panel">
            <p className="text-primary text-xs font-black uppercase tracking-[0.28em] text-glow">Fleet Overview</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none text-white text-glow md:text-6xl">Operational pulse without blocking the sky.</h2>
            <p className="mt-5 max-w-xl text-sm font-bold uppercase leading-relaxed tracking-[0.12em] text-white/[0.55]">
              Metrics float in separate glass cards so the animated route network, GPS dots, and hologram remain visible through the page.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <KPICard title="Active Fleet" value={activeFleet} subtitle="Vehicles on route" icon={<Truck className="h-8 w-8" />} accent />
            <KPICard title="Maintenance" value={inShop} subtitle="Vehicles in shop" icon={<AlertTriangle className="h-8 w-8" />} />
            <KPICard title="Utilization" value={`${utilization}%`} subtitle="Fleet efficiency" icon={<TrendingUp className="h-8 w-8" />} accent />
            <KPICard title="Available" value={available} subtitle="Ready to dispatch" icon={<Activity className="h-8 w-8" />} />
            <KPICard title="Pending Cargo" value={pendingTrips} subtitle="Awaiting assignment" icon={<Package className="h-8 w-8" />} />
            <KPICard title="Active Drivers" value={activeDrivers} subtitle="On duty today" icon={<Clock className="h-8 w-8" />} />
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="landing-slide"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-9 max-w-3xl">
            <p className="text-primary text-xs font-black uppercase tracking-[0.28em] text-glow">Feature System</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none text-white text-glow md:text-6xl">Transparent modules over live logistics.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="landing-glass active-reflection-border rounded-[1.5rem] p-7"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.55 }}
                >
                  <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black uppercase text-white">{feature.title}</h3>
                  <p className="mt-4 text-sm font-semibold leading-relaxed text-white/[0.55]">{feature.body}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Role Based System */}
        <motion.div
          className="landing-slide grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="landing-glass active-reflection-border rounded-[1.5rem] p-8 md:p-10">
            <p className="text-primary text-xs font-black uppercase tracking-[0.28em] text-glow">Role-Based System</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none text-white text-glow md:text-5xl">Every operator keeps the same access rules.</h2>
            <p className="mt-5 text-sm font-semibold leading-relaxed text-white/[0.58]">
              The visual surface changes only the landing arrangement. Protected routes, role guards, state sources, and existing navigation behavior stay untouched.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {roleCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.role}
                  className="landing-glass rounded-[1.25rem] border border-white/10 p-6"
                  initial={{ opacity: 0, x: 36 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.07, duration: 0.5 }}
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/[0.38]">{card.label}</p>
                      <h3 className="mt-3 text-2xl font-black uppercase text-white">{card.role}</h3>
                    </div>
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="mt-7 text-5xl font-black leading-none text-primary text-glow">{card.metric}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Live Dashboard Preview */}
        <div className="landing-slide grid grid-cols-1 gap-8 xl:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="landing-glass active-reflection-border group relative overflow-hidden rounded-[1.5rem] p-6 md:p-9"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex justify-between items-end mb-12 relative z-10">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase text-glow">Fleet Radar</h2>
                <div className="flex items-center gap-3 mt-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ boxShadow: "0 0 10px rgba(204,255,0,0.8)" }} />
                  <p className="text-white/40 text-xs font-bold tracking-[0.3em] uppercase">Live Telemetry Array</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-white/10 text-white/40">
                    <th className="pb-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Identity / Unit</th>
                    <th className="pb-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Class / Rating</th>
                    <th className="pb-6 text-right font-black uppercase tracking-[0.2em] text-[10px]">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vehicles.slice(0, 6).map((v, i) => (
                    <motion.tr
                      key={v.id}
                      className="group/row hover:bg-white/5 transition-colors cursor-none"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                    >
                      <td className="py-6">
                        <div className="font-black text-lg text-white group-hover/row:text-primary transition-colors tracking-tighter uppercase">{v.name}</div>
                        <div className="text-white/40 font-mono text-[10px] tracking-widest mt-1">{v.licensePlate}</div>
                      </td>
                      <td className="py-6 text-white/50 font-bold tracking-widest uppercase text-xs">{v.type}</td>
                      <td className="py-6 text-right"><VehicleStatusBadge status={v.status} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-end">
              <Link to="/vehicles" className="inline-flex items-center gap-3 text-primary text-xs font-black uppercase tracking-[0.2em] hover:text-white transition-colors group/link cursor-none">
                Access Full Registry <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-2" />
              </Link>
            </div>
          </motion.div>

          {/* Recent Trips */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="landing-glass active-reflection-border group relative overflow-hidden rounded-[1.5rem] p-6 md:p-9"
          >
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="flex justify-between items-end mb-12 relative z-10">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase text-glow">Active Routes</h2>
                <div className="flex items-center gap-3 mt-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" style={{ boxShadow: "0 0 10px rgba(204,255,0,0.8)" }} />
                  <p className="text-white/40 text-xs font-bold tracking-[0.3em] uppercase">Global Dispatch Feed</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-white/10 text-white/40">
                    <th className="pb-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Trajectory Setup</th>
                    <th className="pb-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Pilot ID</th>
                    <th className="pb-6 text-right font-black uppercase tracking-[0.2em] text-[10px]">State Sequence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentTrips.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      className="group/row hover:bg-white/5 transition-colors cursor-none"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                    >
                      <td className="py-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-white group-hover/row:text-primary transition-colors tracking-tighter uppercase text-base">{t.origin}</span>
                          <div className="flex items-center gap-2 text-white/30 ml-2">
                            <div className="w-px h-4 bg-white/20"></div>
                            <ArrowDown className="h-3 w-3" />
                          </div>
                          <span className="text-white/60 font-bold uppercase tracking-widest text-xs">{t.destination}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="text-white/80 font-bold uppercase tracking-wider text-xs">{getDriverName(t.driverId)}</div>
                        <div className="text-white/30 font-mono text-[10px] tracking-widest mt-1">{getVehicleName(t.vehicleId)}</div>
                      </td>
                      <td className="py-6 text-right"><TripStatusBadge status={t.status} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-end">
              <Link to="/trips" className="inline-flex items-center gap-3 text-primary text-xs font-black uppercase tracking-[0.2em] hover:text-white transition-colors group/link cursor-none">
                Access Route Logs <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-2" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Analytics Preview */}
        <motion.div
          className="landing-slide grid gap-6 lg:grid-cols-[1fr_0.72fr]"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="landing-glass active-reflection-border overflow-hidden rounded-[1.5rem] p-7 md:p-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-primary text-xs font-black uppercase tracking-[0.28em] text-glow">Analytics Preview</p>
                <h2 className="mt-4 text-4xl font-black uppercase leading-none text-white text-glow md:text-5xl">Capacity trends in glass.</h2>
              </div>
              <Link to="/analytics" className="inline-flex items-center gap-3 text-primary text-xs font-black uppercase tracking-[0.2em] hover:text-white transition-colors group/link cursor-none">
                View Analytics <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-2" />
              </Link>
            </div>
            <div className="mt-10 grid h-72 grid-cols-12 items-end gap-3 border-b border-white/[0.12] pb-5">
              {[42, 66, 58, 82, 74, 92, 63, 78, 88, 70, 95, 84].map((height, index) => (
                <motion.div
                  key={index}
                  className="rounded-t-xl bg-gradient-to-t from-primary/[0.18] via-primary/[0.55] to-cyan-200/70 shadow-[0_0_20px_rgba(204,255,0,0.12)]"
                  style={{ height: `${height}%` }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  whileInView={{ scaleY: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.035, duration: 0.5 }}
                />
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                ["Fleet Health", `${fleetHealth}%`],
                ["Completed Trips", completedTrips],
                ["Route Load", `${pendingTrips + inProgressTrips}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/[0.38]">{label}</p>
                  <p className="mt-3 text-3xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="landing-copy-panel self-center">
            <p className="text-sm font-bold uppercase leading-relaxed tracking-[0.12em] text-white/[0.58]">
              The analytics surface is intentionally bounded and offset, leaving the live wallpaper visible around and through the panel instead of covering the viewport.
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="landing-slide flex items-center justify-center"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="landing-glass active-reflection-border max-w-4xl rounded-[1.5rem] p-8 text-center md:p-12">
            <p className="text-primary text-xs font-black uppercase tracking-[0.28em] text-glow">Get Started</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none text-white text-glow md:text-6xl">Bring the command layer online.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm font-bold uppercase leading-relaxed tracking-[0.12em] text-white/[0.58]">
              Jump directly into dispatch, fleet registry, or analytics while the logistics background continues running behind the UI.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="button-glow h-12 rounded-full bg-primary px-7 text-xs font-black uppercase tracking-[0.16em] text-black hover:bg-primary/90">
                <Link to="/trips">Start Dispatch</Link>
              </Button>
              <Button asChild variant="outline" className="button-glow h-12 rounded-full border-white/[0.18] bg-white/[0.06] px-7 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-white/10 hover:text-primary">
                <Link to="/vehicles">Inspect Vehicles</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
