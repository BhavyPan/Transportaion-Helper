import { motion } from "framer-motion";
import { useState } from "react";
import { useFleet } from "@/context/FleetContext";
import { VehicleStatusBadge } from "@/components/StatusBadge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
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
import type { Vehicle, VehicleType, VehicleStatus } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { EmptySpaceHologram } from "@/components/EmptySpaceHologram";

export default function Vehicles() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useFleet();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<VehicleType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "All">("All");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    name: "",
    type: "Van",
    licensePlate: "",
    maxCapacity: 1000,
    odometer: 0,
    status: "Available",
    region: "Central",
    lastService: new Date().toISOString().split("T")[0]
  });

  const filtered = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.licensePlate.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || v.type === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData(vehicle);
    } else {
      setEditingVehicle(null);
      setFormData({
        name: "",
        type: "Van",
        licensePlate: "",
        maxCapacity: 1000,
        odometer: 0,
        status: "Available",
        region: "Central",
        lastService: new Date().toISOString().split("T")[0]
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.licensePlate) {
      toast({ title: "Validation Error", description: "Name and License Plate are required.", variant: "destructive" });
      return;
    }

    if (editingVehicle) {
      updateVehicle(formData as Vehicle);
      toast({ title: "Vehicle Updated", description: `${formData.name} updated successfully.` });
    } else {
      addVehicle({
        ...(formData as Vehicle),
        id: `v_${Date.now()}`
      });
      toast({ title: "Vehicle Added", description: `${formData.name} added to registry.` });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteVehicle(id);
      toast({ title: "Vehicle Deleted", description: `${name} has been removed.` });
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
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-sm text-glow">Fleet Database</p>
          <div className="h-px w-12 bg-primary hidden md:block"></div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter text-glow">
          Vehicle Registry
        </h1>
        <p className="mt-4 text-white/50 text-xs md:text-sm font-bold tracking-widest uppercase max-w-xl mx-auto">
          Manage and monitor all active transport assets, capabilities, and availability status.
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
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 min-w-[250px] max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search Database..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/50 pl-11 pr-4 py-3 text-xs md:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-none uppercase tracking-wider font-bold"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as VehicleType | "All")}>
              <SelectTrigger className="w-[140px] bg-black/50 border-white/10 text-white focus:ring-primary cursor-none text-xs font-bold uppercase tracking-wider h-[46px] rounded-xl">
                <SelectValue placeholder="Class Filter" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl cursor-none">
                <SelectItem value="All" className="cursor-none hover:bg-primary hover:text-black">All Classes</SelectItem>
                <SelectItem value="Truck" className="cursor-none hover:bg-primary hover:text-black">Truck</SelectItem>
                <SelectItem value="Van" className="cursor-none hover:bg-primary hover:text-black">Van</SelectItem>
                <SelectItem value="Bike" className="cursor-none hover:bg-primary hover:text-black">Bike</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as VehicleStatus | "All")}>
              <SelectTrigger className="w-[140px] bg-black/50 border-white/10 text-white focus:ring-primary cursor-none text-xs font-bold uppercase tracking-wider h-[46px] rounded-xl">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl cursor-none">
                <SelectItem value="All" className="cursor-none hover:bg-primary hover:text-black">All Status</SelectItem>
                <SelectItem value="Available" className="cursor-none hover:bg-primary hover:text-black">Available</SelectItem>
                <SelectItem value="On Trip" className="cursor-none hover:bg-primary hover:text-black">On Trip</SelectItem>
                <SelectItem value="In Shop" className="cursor-none hover:bg-primary hover:text-black">In Shop</SelectItem>
                <SelectItem value="Retired" className="cursor-none hover:bg-primary hover:text-black">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => handleOpenDialog()}
            className="w-full md:w-auto gap-3 bg-primary text-black font-black uppercase tracking-[0.2em] hover:bg-primary/80 transition-all rounded-xl h-[46px] cursor-none shadow-[0_0_15px_rgba(204,255,0,0.3)]"
          >
            <Plus className="h-5 w-5" /> Initialize Asset
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
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none z-0" />
          {filtered.length === 0 && (
            <EmptySpaceHologram
              variant="registry"
              className="inset-x-4 top-6 h-[min(54vh,560px)] md:inset-x-10 md:top-8"
            />
          )}

          <div className="overflow-x-auto relative z-10 w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-white/10 text-white/40">
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Identity</th>
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px] hidden sm:table-cell">Callsign</th>
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Class</th>
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px] hidden lg:table-cell">Payload</th>
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px] hidden lg:table-cell">Telemetry</th>
                  <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                  <th className="px-6 py-6 text-right font-black uppercase tracking-[0.2em] text-[10px]">Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((v, i) => (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 10) * 0.05, duration: 0.5 }}
                    className="group/row hover:bg-white/5 transition-colors cursor-none"
                  >
                    <td className="px-6 py-6">
                      <span className="font-black text-base md:text-lg text-white group-hover/row:text-primary transition-colors tracking-tighter uppercase">{v.name}</span>
                      <span className="block sm:hidden text-white/40 font-mono text-[10px] tracking-widest mt-1">{v.licensePlate}</span>
                    </td>
                    <td className="px-6 py-6 font-mono text-xs tracking-widest text-white/50 hidden sm:table-cell">{v.licensePlate}</td>
                    <td className="px-6 py-6 text-white/80 font-bold uppercase tracking-widest text-xs">{v.type}</td>
                    <td className="px-6 py-6 text-white/40 font-mono text-xs hidden lg:table-cell">{v.maxCapacity.toLocaleString()} kg</td>
                    <td className="px-6 py-6 text-white/40 font-mono text-xs hidden lg:table-cell">{v.odometer.toLocaleString()} km</td>
                    <td className="px-6 py-6"><VehicleStatusBadge status={v.status} /></td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(v)} className="cursor-none hover:bg-white/10 hover:text-primary transition-colors">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id, v.name)} className="cursor-none hover:bg-destructive/20 hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-white/40 font-bold uppercase tracking-widest text-sm text-glow">No telemetric data found</p>
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass-neon border border-primary/20 bg-black/90 p-8 rounded-3xl cursor-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter text-glow">
              {editingVehicle ? 'Update Asset' : 'Initialize Asset'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Identity Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary transition-all cursor-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Callsign (Plate)</Label>
              <Input id="plate" value={formData.licensePlate} onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary transition-all cursor-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Class</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as VehicleType })}>
                <SelectTrigger className="bg-black/50 border-white/10 text-white focus:ring-primary cursor-none">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl cursor-none">
                  <SelectItem value="Truck" className="cursor-none hover:bg-primary hover:text-black">Truck</SelectItem>
                  <SelectItem value="Van" className="cursor-none hover:bg-primary hover:text-black">Van</SelectItem>
                  <SelectItem value="Bike" className="cursor-none hover:bg-primary hover:text-black">Bike</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Payload Capacity (kg)</Label>
              <Input id="capacity" type="number" value={formData.maxCapacity} onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary transition-all cursor-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Current Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as VehicleStatus })}>
                <SelectTrigger className="bg-black/50 border-white/10 text-white focus:ring-primary cursor-none">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl cursor-none">
                  <SelectItem value="Available" className="cursor-none hover:bg-primary hover:text-black">Available</SelectItem>
                  <SelectItem value="On Trip" className="cursor-none hover:bg-primary hover:text-black">On Trip</SelectItem>
                  <SelectItem value="In Shop" className="cursor-none hover:bg-primary hover:text-black">In Shop</SelectItem>
                  <SelectItem value="Retired" className="cursor-none hover:bg-primary hover:text-black">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-8 border-t border-white/10 pt-6">
            <Button onClick={handleSave} className="w-full bg-primary text-black font-black uppercase tracking-[0.2em] hover:bg-primary/80 transition-all h-12 cursor-none" style={{ boxShadow: "0 0 20px rgba(204,255,0,0.3)" }}>
              Commit Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
