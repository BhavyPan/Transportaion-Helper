import { motion } from "framer-motion";
import { useState } from "react";
import { useFleet } from "@/context/FleetContext";
import { TripStatusBadge } from "@/components/StatusBadge";
import { Plus, Play, CheckCircle, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Trip, TripStatus, FuelLog } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { EmptySpaceHologram } from "@/components/EmptySpaceHologram";

export default function Trips() {
  const { trips, vehicles, drivers, createTrip, startTrip, completeTrip, addFuelLog } = useFleet();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<TripStatus | "All">("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isFuelDialogOpen, setIsFuelDialogOpen] = useState(false);

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [finalOdometer, setFinalOdometer] = useState<number>(0);

  const [fuelData, setFuelData] = useState<Partial<FuelLog>>({
    liters: 0,
    cost: 0,
    date: new Date().toISOString().split("T")[0]
  });

  const [formData, setFormData] = useState<Partial<Trip>>({
    origin: "",
    destination: "",
    cargoWeight: 0,
    vehicleId: "",
    driverId: "",
  });

  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || "Unknown";
  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name || "Unknown";

  const availableVehicles = vehicles.filter(v => v.status === "Available");
  const availableDrivers = drivers.filter(d =>
    (d.status === "On Duty" || d.status === "Off Duty") &&
    new Date(d.licenseExpiry) > new Date()
  );

  const filtered = statusFilter === "All" ? trips : trips.filter(t => t.status === statusFilter);

  const handleCreate = () => {
    if (!formData.vehicleId || !formData.driverId || !formData.origin || !formData.destination) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (selectedVehicle && (formData.cargoWeight || 0) > selectedVehicle.maxCapacity) {
      toast({
        title: "Overweight Cargo",
        description: `Cargo weight ${formData.cargoWeight}kg exceeds ${selectedVehicle.name}'s max capacity of ${selectedVehicle.maxCapacity}kg.`,
        variant: "destructive"
      });
      return;
    }

    createTrip({
      id: `t_${Date.now()}`,
      origin: formData.origin!,
      destination: formData.destination!,
      cargoWeight: formData.cargoWeight || 0,
      vehicleId: formData.vehicleId,
      driverId: formData.driverId,
      status: "Draft",
      createdAt: new Date().toISOString()
    });

    toast({ title: "Trip Created", description: "Trip has been created as Draft." });
    setIsDialogOpen(false);
    setFormData({ origin: "", destination: "", cargoWeight: 0, vehicleId: "", driverId: "" });
  };

  const handleDispatch = (id: string) => {
    const tripToDispatch = trips.find(t => t.id === id);
    if (!tripToDispatch) return;

    const vehicle = vehicles.find(v => v.id === tripToDispatch.vehicleId);
    if (vehicle && vehicle.status !== "Available") {
      toast({ title: "Dispatch Failed", description: `Vehicle ${vehicle.name} is currently ${vehicle.status}.`, variant: "destructive" });
      return;
    }

    const driver = drivers.find(d => d.id === tripToDispatch.driverId);
    if (driver && driver.status !== "On Duty" && driver.status !== "Off Duty") {
      toast({ title: "Dispatch Failed", description: `Driver ${driver.name} is currently ${driver.status}.`, variant: "destructive" });
      return;
    }

    startTrip(id);
    toast({ title: "Trip Dispatched", description: "Vehicle and Driver statuses updated." });
  };

  const openCompleteDialog = (trip: Trip) => {
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    setFinalOdometer(vehicle?.odometer || 0);
    setSelectedTrip(trip);
    setIsCompleteDialogOpen(true);
  };

  const handleComplete = () => {
    if (selectedTrip) {
      completeTrip(selectedTrip.id, finalOdometer);
      toast({ title: "Trip Completed", description: "Vehicle is now Available." });
      setIsCompleteDialogOpen(false);
    }
  };

  const openFuelDialog = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsFuelDialogOpen(true);
    setFuelData({
      liters: 0,
      cost: 0,
      date: new Date().toISOString().split("T")[0]
    });
  };

  const handleAddFuel = () => {
    const vehicle = vehicles.find(v => v.id === selectedTrip?.vehicleId);
    if (selectedTrip && vehicle) {
      addFuelLog({
        id: `f_${Date.now()}`,
        vehicleId: selectedTrip.vehicleId,
        liters: fuelData.liters || 0,
        cost: fuelData.cost || 0,
        date: fuelData.date || new Date().toISOString().split("T")[0],
        odometer: vehicle.odometer
      });
      toast({ title: "Fuel Logged", description: "Fuel and expense logged successfully." });
      setIsFuelDialogOpen(false);
    }
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
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-sm text-glow">Logistics Control</p>
          <div className="h-px w-12 bg-primary hidden md:block"></div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter text-glow">
          Dispatch Orders
        </h1>
        <p className="mt-4 text-white/50 text-xs md:text-sm font-bold tracking-widest uppercase max-w-xl mx-auto">
          Coordinate, dispatch, and track active delivery operations and field personnel.
        </p>
      </motion.div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-8">

        {/* Controls Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass p-6 rounded-3xl border-white/5 active-reflection-border relative z-20"
        >
          <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {(["All", "Draft", "Dispatched", "Completed", "Cancelled"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-6 py-3 text-xs font-black transition-all uppercase tracking-[0.2em] whitespace-nowrap cursor-none ${statusFilter === s
                    ? "bg-primary text-black shadow-[0_0_20px_rgba(204,255,0,0.4)] scale-105"
                    : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="w-full md:w-auto gap-3 bg-primary text-black font-black uppercase tracking-[0.2em] hover:bg-primary/80 transition-all rounded-xl h-[46px] cursor-none shadow-[0_0_15px_rgba(204,255,0,0.3)] shrink-0"
          >
            <Plus className="h-5 w-5" /> Generate Order
          </Button>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="rounded-[2.5rem] glass p-8 active-reflection-border group relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none z-0" />
          {filtered.length === 0 && (
            <EmptySpaceHologram
              variant="convoy"
              className="inset-x-4 top-6 h-[min(54vh,540px)] md:inset-x-10 md:top-8"
            />
          )}

          <div className="overflow-x-auto relative z-10 w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-white/10 text-white/40">
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Route Path</th>
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Asset</th>
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Operator</th>
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px] hidden lg:table-cell">Payload</th>
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px] hidden md:table-cell">Timestamp</th>
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                  <th className="px-6 py-6 text-right font-black uppercase tracking-[0.2em] text-[10px]">Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 8) * 0.05, duration: 0.4 }}
                    className="group/row hover:bg-white/5 transition-colors cursor-none"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-white text-base max-w-[120px] truncate">{t.origin}</span>
                        <div className="h-px w-4 bg-white/20 group-hover/row:bg-primary transition-colors"></div>
                        <span className="font-black text-white/60 text-sm max-w-[120px] truncate">{t.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-white/80 font-mono text-xs tracking-widest uppercase">{getVehicleName(t.vehicleId)}</td>
                    <td className="px-6 py-6 text-primary/80 font-bold text-xs uppercase tracking-widest">{getDriverName(t.driverId)}</td>
                    <td className="px-6 py-6 text-white/40 font-mono text-xs hidden lg:table-cell">{t.cargoWeight.toLocaleString()} KG</td>
                    <td className="px-6 py-6 text-white/40 font-mono text-xs hidden md:table-cell tracking-widest">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-6"><TripStatusBadge status={t.status} /></td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {t.status === "Draft" && (
                          <Button variant="outline" size="sm" onClick={() => handleDispatch(t.id)} className="cursor-none border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 uppercase tracking-widest text-[10px] font-bold">
                            <Play className="h-3 w-3 mr-2" /> Dispatch
                          </Button>
                        )}
                        {t.status === "Dispatched" && (
                          <Button variant="outline" size="sm" onClick={() => openCompleteDialog(t)} className="cursor-none border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300 uppercase tracking-widest text-[10px] font-bold">
                            <CheckCircle className="h-3 w-3 mr-2" /> Complete
                          </Button>
                        )}
                        {t.status === "Completed" && (
                          <Button variant="outline" size="sm" onClick={() => openFuelDialog(t)} className="cursor-none border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 uppercase tracking-widest text-[10px] font-bold">
                            <Fuel className="h-3 w-3 mr-2" /> Log Fuel
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-white/40 font-bold uppercase tracking-widest text-sm text-glow">No dispatch records found</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dialogs updated for cinematic style */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass-neon border border-primary/20 bg-black/90 p-8 rounded-3xl cursor-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter text-glow">
              Generate Route Order
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="origin" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Origin Point</Label>
              <Input id="origin" value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary transition-all cursor-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dest" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Destination Point</Label>
              <Input id="dest" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary transition-all cursor-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Payload Mass (KG)</Label>
              <Input id="weight" type="number" value={formData.cargoWeight} onChange={e => setFormData({ ...formData, cargoWeight: parseInt(e.target.value) })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary transition-all cursor-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Assign Asset</Label>
              <Select value={formData.vehicleId} onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}>
                <SelectTrigger className="bg-black/50 border-white/10 text-white focus:ring-primary cursor-none">
                  <SelectValue placeholder="Select Available Asset" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl cursor-none">
                  {availableVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id} className="cursor-none hover:bg-primary hover:text-black">{v.name} ({v.maxCapacity}K MAX)</SelectItem>
                  ))}
                  {availableVehicles.length === 0 && <SelectItem value="none" disabled className="text-white/40">No assets available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Assign Operator</Label>
              <Select value={formData.driverId} onValueChange={(v) => setFormData({ ...formData, driverId: v })}>
                <SelectTrigger className="bg-black/50 border-white/10 text-white focus:ring-primary cursor-none">
                  <SelectValue placeholder="Select Available Operator" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl cursor-none">
                  {availableDrivers.map(d => (
                    <SelectItem key={d.id} value={d.id} className="cursor-none hover:bg-primary hover:text-black">{d.name}</SelectItem>
                  ))}
                  {availableDrivers.length === 0 && <SelectItem value="none" disabled className="text-white/40">No operators available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-8 border-t border-white/10 pt-6">
            <Button onClick={handleCreate} className="w-full bg-primary text-black font-black uppercase tracking-[0.2em] hover:bg-primary/80 transition-all h-12 cursor-none shadow-[0_0_20px_rgba(204,255,0,0.3)]">
              Initialize Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass border border-primary/20 bg-black/90 p-8 rounded-3xl cursor-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter text-glow">Confirm Arrival</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Verify final telemetric reading for returning asset.</p>
            <div className="space-y-2">
              <Label htmlFor="odo" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Final Odometer</Label>
              <Input id="odo" type="number" value={finalOdometer} onChange={e => setFinalOdometer(parseInt(e.target.value))} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none font-mono tracking-widest" />
            </div>
          </div>
          <DialogFooter className="mt-8 pt-6 border-t border-white/10">
            <Button onClick={handleComplete} className="w-full bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-[0.2em] transition-all h-12 cursor-none">Acknowledge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFuelDialogOpen} onOpenChange={setIsFuelDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass border border-primary/20 bg-black/90 p-8 rounded-3xl cursor-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter text-glow">Log Fuel Expense</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="liters" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Volume (Liters)</Label>
              <Input id="liters" type="number" value={fuelData.liters} onChange={e => setFuelData({ ...fuelData, liters: parseFloat(e.target.value) })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Total Cost ($)</Label>
              <Input id="cost" type="number" value={fuelData.cost} onChange={e => setFuelData({ ...fuelData, cost: parseFloat(e.target.value) })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none font-mono" />
            </div>
          </div>
          <DialogFooter className="mt-8 pt-6 border-t border-white/10">
            <Button onClick={handleAddFuel} className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-[0.2em] transition-all h-12 cursor-none">Submit Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
