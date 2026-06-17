import { motion, Variants } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";
import { useFleet } from "@/context/FleetContext";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ["hsl(152, 60%, 42%)", "hsl(210, 80%, 55%)", "hsl(38, 92%, 50%)", "hsl(220, 10%, 60%)"];

// Simulated average payload revenue per km depending on the vehicle type
const REVENUE_PER_KM = {
  Truck: 5.5,
  Van: 2.5,
  Bike: 1.0,
};

const SIMULATED_ACQUISITION_COST = {
  Truck: 80000,
  Van: 35000,
  Bike: 5000,
};

export default function Analytics() {
  const { vehicles, fuelLogs, maintenanceLogs, trips } = useFleet();

  // Vehicle status distribution
  const statusCounts: Record<string, number> = {
    "Available": 0,
    "On Trip": 0,
    "Maintenance (In Shop)": 0,
    "Retired": 0,
  };

  vehicles.forEach((v) => {
    const key = v.status === "In Shop" ? "Maintenance (In Shop)" : v.status;
    statusCounts[key] = (statusCounts[key] || 0) + 1;
  });

  const pieData = Object.entries(statusCounts)
    .filter(([_, value]) => value >= 0) // Keep them all to show in legend
    .map(([name, value]) => ({ name, value }));

  // Fuel efficiency and ROI by vehicle
  const vehicleStats = vehicles
    .filter(v => v.status !== "Retired")
    .map(v => {
      const vFuelLogs = fuelLogs.filter(f => f.vehicleId === v.id);
      const vMaintLogs = maintenanceLogs.filter(m => m.vehicleId === v.id);

      const totalFuelCost = vFuelLogs.reduce((s, l) => s + l.cost, 0);
      const totalLiters = vFuelLogs.reduce((s, l) => s + l.liters, 0);
      const totalMaintCost = vMaintLogs.reduce((s, l) => s + l.cost, 0);

      const fuelEfficiency = totalLiters > 0 ? (v.odometer / totalLiters) : 0;

      const estimatedRevenue = v.odometer * (REVENUE_PER_KM[v.type as keyof typeof REVENUE_PER_KM] || 1);
      const acquisitionCost = SIMULATED_ACQUISITION_COST[v.type as keyof typeof SIMULATED_ACQUISITION_COST] || 10000;

      // ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      const roi = ((estimatedRevenue - (totalMaintCost + totalFuelCost)) / acquisitionCost) * 100;

      return {
        name: v.name.split(" ")[1] || v.name,
        fuelCost: Math.round(totalFuelCost),
        maintCost: Math.round(totalMaintCost),
        efficiency: Math.round(fuelEfficiency * 10) / 10,
        roi: Math.round(roi)
      };
    });

  const fuelByVehicle = vehicleStats.filter(d => d.fuelCost > 0).map(d => ({ name: d.name, fuel: d.fuelCost }));
  const maintByVehicle = vehicleStats.filter(d => d.maintCost > 0).map(d => ({ name: d.name, cost: d.maintCost }));

  // Trip completion
  const tripStats = [
    { name: "Completed", value: trips.filter(t => t.status === "Completed").length },
    { name: "Active", value: trips.filter(t => t.status === "Dispatched").length },
    { name: "Draft", value: trips.filter(t => t.status === "Draft").length },
    { name: "Cancelled", value: trips.filter(t => t.status === "Cancelled").length },
  ];

  const totalFuelCost = fuelLogs.reduce((s, l) => s + l.cost, 0);
  const totalMaintCost = maintenanceLogs.reduce((s, l) => s + l.cost, 0);

  const handleExportCSV = () => {
    const headers = "Vehicle,Fuel Cost,Maintenance Cost,Efficiency (km/L),ROI (%)\n";
    const rows = vehicleStats.map(v => `${v.name},${v.fuelCost},${v.maintCost},${v.efficiency},${v.roi}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fleet_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[150%] bg-primary/5 rounded-[100%] blur-[120px] pointer-events-none z-0" />

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-primary hidden md:block"></div>
            <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-sm text-glow">Data Intelligence</p>
            <div className="h-px w-12 bg-primary hidden md:block"></div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter text-glow">
            Fleet Analytics
          </h1>
          <p className="mt-4 text-white/50 text-xs md:text-sm font-bold tracking-widest uppercase max-w-xl mx-auto">
            Real-time financial performance, asset utilization, and operational tracking.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="gap-3 bg-white/5 text-white hover:bg-white/10 font-black uppercase tracking-[0.2em] transition-all rounded-xl h-[46px] cursor-none border border-white/10"
            >
              <Download className="h-5 w-5" /> Export Intelligence Data
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 relative z-10">

        {/* KPI Row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <motion.div variants={itemVariants} className="rounded-3xl border border-white/10 glass p-8 active-reflection-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Total Fuel Expenditure</p>
            <p className="text-4xl lg:text-5xl font-black text-white tracking-tighter text-glow">${totalFuelCost.toFixed(0)}</p>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-3xl border border-white/10 glass p-8 active-reflection-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Total Maintenance Cost</p>
            <p className="text-4xl lg:text-5xl font-black text-white tracking-tighter text-glow">${totalMaintCost.toLocaleString()}</p>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-3xl border border-white/10 glass p-8 active-reflection-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Total Operational Cost</p>
            <p className="text-4xl lg:text-5xl font-black text-white tracking-tighter opacity-80">${(totalFuelCost + totalMaintCost).toFixed(0)}</p>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-3xl border border-primary/40 bg-black/60 backdrop-blur-3xl p-8 shadow-[0_0_30px_rgba(204,255,0,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 glow-text">Fleet ROI Overview</p>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Average Return</span>
                <span className="text-2xl font-black text-white tracking-tighter text-glow">
                  {vehicleStats.length ? Math.round(vehicleStats.reduce((s, v) => s + v.roi, 0) / vehicleStats.length) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Top Performer</span>
                <span className="text-lg font-black text-white tracking-widest uppercase">
                  {vehicleStats.length ? vehicleStats.reduce((prev, current) => (prev.roi > current.roi) ? prev : current).name : "N/A"}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Charts Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Status Distribution */}
          <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-white/10 glass p-8 active-reflection-border flex flex-col">
            <div className="mb-8">
              <h3 className="text-lg font-black text-white uppercase tracking-widest text-glow">Fleet Status Distribution</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">Current operational states of all assets</p>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} dataKey="value" paddingAngle={4} stroke="rgba(0,0,0,0.5)" strokeWidth={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: "#fff", backdropFilter: "blur(10px)" }}
                    itemStyle={{ color: "#fff", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    formatter={(value) => <span className="text-xs font-bold text-white/80 uppercase tracking-widest ml-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Maintenance Cost */}
          <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-white/10 glass p-8 active-reflection-border flex flex-col">
            <div className="mb-8">
              <h3 className="text-lg font-black text-white uppercase tracking-widest text-glow">Maintenance Deficit ($)</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">Cost analysis per vehicle unit</p>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintByVehicle} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: "#fff", backdropFilter: "blur(10px)" }}
                    itemStyle={{ color: COLORS[2], fontWeight: "900", fontSize: "16px" }}
                  />
                  <Bar dataKey="cost" fill={COLORS[2]} radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {maintByVehicle.map((_, index) => (
                      <Cell key={`cell-${index}`} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Fuel Efficiency */}
          <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-white/10 glass p-8 active-reflection-border flex flex-col">
            <div className="mb-8">
              <h3 className="text-lg font-black text-white uppercase tracking-widest text-glow">Efficiency Matrix (km/L)</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">Fuel consumption performance</p>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: "#fff", backdropFilter: "blur(10px)" }}
                    itemStyle={{ color: COLORS[0], fontWeight: "900", fontSize: "16px" }}
                  />
                  <Bar dataKey="efficiency" fill={COLORS[0]} radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Vehicle ROI */}
          <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-primary/20 bg-black/40 p-8 shadow-[inset_0_0_50px_rgba(204,255,0,0.05)] active-reflection-border flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="mb-8 relative z-10">
              <h3 className="text-lg font-black text-primary uppercase tracking-widest text-glow">Asset ROI (%)</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">Return on investment per unit</p>
            </div>
            <div className="flex-1 min-h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: "rgba(204,255,0,0.6)", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    cursor={{ fill: "rgba(204,255,0,0.05)" }}
                    contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(204,255,0,0.2)", borderRadius: "16px", color: "#fff", backdropFilter: "blur(10px)" }}
                    itemStyle={{ color: "hsl(75, 100%, 50%)", fontWeight: "900", fontSize: "18px" }}
                    formatter={(value: number) => [`${value}%`, "ROI"]}
                  />
                  <Bar dataKey="roi" fill="hsl(75, 100%, 50%)" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {vehicleStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Trip Breakdown */}
          <motion.div variants={itemVariants} className="lg:col-span-2 rounded-[2.5rem] border border-white/10 glass p-8 active-reflection-border flex flex-col lg:flex-row gap-8 items-center">
            <div className="lg:w-1/3 w-full">
              <h3 className="text-2xl font-black text-white uppercase tracking-widest text-glow mb-2">Mission Status</h3>
              <p className="text-sm text-white/40 uppercase tracking-widest font-bold mb-8">Aggregate breakdown of all dispatched sorties.</p>

              <div className="space-y-4">
                {tripStats.map((stat, i) => (
                  <div key={stat.name} className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-xs font-bold uppercase tracking-widest text-white/80">{stat.name}</span>
                    </div>
                    <span className="font-black text-lg text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-2/3 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tripStats} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: "#fff", backdropFilter: "blur(10px)" }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                    {tripStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
