import { motion } from "framer-motion";
import { useState } from "react";
import { useFleet } from "@/context/FleetContext";
import { useAuth } from "@/context/AuthContext";
import { Wrench, Clock, CheckCircle2, Plus, Edit, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MaintenanceLog, Driver, VehicleStatus, VehicleType, DriverStatus } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";

const statusIcon = {
  Scheduled: <Clock className="h-4 w-4 text-info" />,
  "In Progress": <Wrench className="h-4 w-4 text-warning" />,
  Completed: <CheckCircle2 className="h-4 w-4 text-success" />,
};

const statusColor = {
  Scheduled: "status-on-trip text-glow font-bold",
  "In Progress": "status-in-shop text-glow font-bold",
  Completed: "status-available text-glow font-bold",
};

export default function Maintenance() {
  const {
    maintenanceLogs,
    vehicles,
    drivers,
    addMaintenanceLog,
    completeMaintenanceLog,
    addDriver,
    updateDriver,
    deleteDriver,
    updateVehicleStatus
  } = useFleet();
  const { user } = useAuth();
  const { toast } = useToast();

  // Service Log State
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [serviceFormData, setServiceFormData] = useState<Partial<MaintenanceLog>>({
    vehicleId: "", type: "Repair", description: "", cost: 0, date: new Date().toISOString().split("T")[0], status: "In Progress"
  });

  // Driver Management State
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isEditingDriver, setIsEditingDriver] = useState(false);
  const [driverFormData, setDriverFormData] = useState<Partial<Driver>>({
    name: "", phone: "", licenseExpiry: new Date().toISOString().split("T")[0], safetyScore: 100, status: "Off Duty"
  });

  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || "Unknown";

  const handleCreateService = () => {
    if (!serviceFormData.vehicleId || !serviceFormData.type || !serviceFormData.description) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    addMaintenanceLog({
      id: `m_${Date.now()}`,
      vehicleId: serviceFormData.vehicleId,
      type: serviceFormData.type,
      description: serviceFormData.description,
      cost: serviceFormData.cost || 0,
      date: serviceFormData.date || new Date().toISOString().split("T")[0],
      status: serviceFormData.status as any
    });
    toast({ title: "Service Logged", description: "Vehicle status automatically set to 'In Shop'." });
    setIsServiceDialogOpen(false);
    setServiceFormData({ vehicleId: "", type: "Repair", description: "", cost: 0, date: new Date().toISOString().split("T")[0], status: "In Progress" });
  };

  const handleSaveDriver = () => {
    if (!driverFormData.name || !driverFormData.phone || !driverFormData.licenseExpiry) {
      toast({ title: "Validation Error", description: "Please fill all required driver fields.", variant: "destructive" });
      return;
    }

    if (isEditingDriver && driverFormData.id) {
      updateDriver(driverFormData as Driver);
      toast({ title: "Driver Updated", description: `${driverFormData.name}'s profile has been updated.` });
    } else {
      addDriver({
        ...driverFormData,
        id: `d_${Date.now()}`,
        status: driverFormData.status || "Off Duty",
        tripsCompleted: 0,
        licenseCategories: ["Van", "Truck"], // Default, could be expanded in form
      } as Driver);
      toast({ title: "Driver Hired", description: `${driverFormData.name} has been added to the registry.` });
    }
    setIsDriverDialogOpen(false);
  };

  const openEditDriver = (driver: Driver) => {
    setDriverFormData(driver);
    setIsEditingDriver(true);
    setIsDriverDialogOpen(true);
  };

  const handleFireDriver = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to terminate ${name}? This action cannot be undone.`)) {
      deleteDriver(id);
      toast({ title: "Driver Terminated", description: `${name} has been removed.` });
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
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-sm text-glow">System Configuration</p>
          <div className="h-px w-12 bg-primary hidden md:block"></div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter text-glow">
          Maintenance & Admin
        </h1>
        <p className="mt-4 text-white/50 text-xs md:text-sm font-bold tracking-widest uppercase max-w-xl mx-auto">
          Preventative fleet tracking, service logging, and administrative utilities.
        </p>
      </motion.div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 relative z-10">
        <Tabs defaultValue="service-logs" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-black/50 border border-white/10 rounded-2xl p-1 h-auto cursor-none">
              <TabsTrigger
                value="service-logs"
                className="rounded-xl py-3 text-xs font-black uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-black transition-all cursor-none"
              >
                Service Logs
              </TabsTrigger>
              {user?.role === "Manager" && (
                <TabsTrigger
                  value="fleet-admin"
                  className="rounded-xl py-3 text-xs font-black uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-black transition-all cursor-none"
                >
                  Administration
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* SERVICE LOGS TAB */}
          <TabsContent value="service-logs" className="space-y-8 mt-0 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-between items-center glass p-6 rounded-3xl border-white/5 active-reflection-border"
            >
              <h2 className="text-xl font-black text-white uppercase tracking-widest text-glow">Maintenance Records</h2>
              <Button
                onClick={() => setIsServiceDialogOpen(true)}
                className="gap-3 bg-primary text-black font-black uppercase tracking-[0.2em] hover:bg-primary/80 transition-all rounded-xl h-[46px] cursor-none shadow-[0_0_15px_rgba(204,255,0,0.3)]"
              >
                <Plus className="h-5 w-5" /> Log Service
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8 }}
              className="rounded-[2.5rem] glass p-8 active-reflection-border group relative overflow-hidden"
            >
              <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-warning/5 rounded-full blur-[100px] pointer-events-none z-0" />

              <div className="overflow-x-auto relative z-10 w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-white/10 text-white/40">
                      <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Asset</th>
                      <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Service Type</th>
                      <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px] hidden md:table-cell">Details</th>
                      <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Cost</th>
                      <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px] hidden sm:table-cell">Timestamp</th>
                      <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                      <th className="px-6 py-6 text-right font-black uppercase tracking-[0.2em] text-[10px]">Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {maintenanceLogs.map((log, i) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (i % 8) * 0.05, duration: 0.4 }}
                        className="hover:bg-white/5 transition-colors cursor-none"
                      >
                        <td className="px-6 py-6 font-bold text-white uppercase tracking-widest">{getVehicleName(log.vehicleId)}</td>
                        <td className="px-6 py-6 text-white/80 font-mono text-xs uppercase tracking-widest">{log.type}</td>
                        <td className="px-6 py-6 text-white/40 max-w-[200px] truncate hidden md:table-cell">{log.description}</td>
                        <td className="px-6 py-6 font-black text-white text-lg tracking-tighter text-glow">${log.cost.toLocaleString()}</td>
                        <td className="px-6 py-6 text-white/40 font-mono text-xs hidden sm:table-cell tracking-widest">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full w-fit border border-white/5">
                            {statusIcon[log.status]}
                            <span className={`uppercase text-[10px] tracking-widest ${statusColor[log.status]}`}>{log.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                          {log.status !== "Completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                completeMaintenanceLog(log.id);
                                toast({ title: "Service Completed", description: "Vehicle is now Available." });
                              }}
                              className="cursor-none border-success/30 text-success hover:bg-success/20 hover:text-success uppercase tracking-widest text-[10px] font-bold"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-2" /> Complete
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </TabsContent>

          {/* FLEET ADMIN TAB */}
          {user?.role === "Manager" && (
            <TabsContent value="fleet-admin" className="space-y-12 mt-0 focus-visible:outline-none focus-visible:ring-0">

              {/* Driver Management Section */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass p-6 rounded-3xl border-white/5 active-reflection-border">
                  <h3 className="text-xl font-black text-white uppercase tracking-widest text-glow flex items-center gap-3">
                    <UsersIcon className="h-6 w-6 text-primary" /> Personnel Management
                  </h3>
                  <Button
                    onClick={() => { setIsEditingDriver(false); setDriverFormData({ name: "", phone: "", licenseExpiry: new Date().toISOString().split("T")[0], safetyScore: 100, status: "Off Duty" }); setIsDriverDialogOpen(true); }}
                    className="gap-3 bg-white/10 text-white hover:bg-white/20 font-black uppercase tracking-[0.2em] transition-all rounded-xl h-[46px] cursor-none border border-white/10 w-full sm:w-auto"
                  >
                    <Plus className="h-5 w-5" /> Hire Operator
                  </Button>
                </div>

                <div className="rounded-[2.5rem] glass p-8 active-reflection-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />
                  <div className="overflow-x-auto relative z-10 w-full">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-white/10 text-white/40">
                          <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Designation</th>
                          <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Comms Link</th>
                          <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Certification Expiry</th>
                          <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                          <th className="px-6 py-6 text-right font-black uppercase tracking-[0.2em] text-[10px]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {drivers.map((driver, i) => (
                          <motion.tr
                            key={driver.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (i % 8) * 0.05, duration: 0.4 }}
                            className="hover:bg-white/5 transition-colors cursor-none"
                          >
                            <td className="px-6 py-6 font-bold text-white uppercase tracking-widest">{driver.name}</td>
                            <td className="px-6 py-6 text-primary/80 font-mono text-xs">{driver.phone}</td>
                            <td className="px-6 py-6 text-white/60 font-mono text-xs tracking-widest">{new Date(driver.licenseExpiry).toLocaleDateString()}</td>
                            <td className="px-6 py-6"><span className="uppercase text-[10px] tracking-widest font-bold text-white/80">{driver.status}</span></td>
                            <td className="px-6 py-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <Button variant="ghost" size="icon" onClick={() => openEditDriver(driver)} className="cursor-none hover:bg-white/10 hover:text-white text-white/40 rounded-full">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleFireDriver(driver.id, driver.name)} className="cursor-none hover:bg-destructive/20 hover:text-destructive text-destructive/60 rounded-full">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>

              {/* Vehicle Status Override Section */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="glass p-6 rounded-3xl border-white/5 active-reflection-border">
                  <h3 className="text-xl font-black text-white uppercase tracking-widest text-glow flex items-center gap-3">
                    <ShieldAlert className="h-6 w-6 text-warning" /> Asset Override Controls
                  </h3>
                  <p className="mt-2 text-xs text-white/40 uppercase tracking-widest font-bold">Manual override for vehicle state management.</p>
                </div>

                <div className="rounded-[2.5rem] glass p-8 active-reflection-border relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-warning/5 rounded-full blur-[100px] pointer-events-none z-0" />
                  <div className="overflow-x-auto relative z-10 w-full">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-white/10 text-white/40">
                          <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Asset Designation</th>
                          <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Plate Registration</th>
                          <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px]">Current Status</th>
                          <th className="px-6 py-6 text-left font-black uppercase tracking-[0.2em] text-[10px] w-[250px]">Manual Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {vehicles.map((v, i) => (
                          <motion.tr
                            key={v.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (i % 8) * 0.05, duration: 0.4 }}
                            className="hover:bg-white/5 transition-colors cursor-none"
                          >
                            <td className="px-6 py-6 font-bold text-white uppercase tracking-widest">{v.name}</td>
                            <td className="px-6 py-6 text-primary/80 font-mono text-xs tracking-widest">{v.licensePlate}</td>
                            <td className="px-6 py-6">
                              <span className={`uppercase text-[10px] tracking-widest font-bold ${v.status === "Available" ? "text-success" :
                                  v.status === "On Trip" ? "text-info" :
                                    v.status === "In Shop" ? "text-warning" : "text-destructive"
                                }`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="px-6 py-6">
                              <Select
                                value={v.status}
                                onValueChange={(status: VehicleStatus) => {
                                  updateVehicleStatus(v.id, status);
                                  toast({ title: "Status Overridden", description: `${v.name} forced to ${status}.` });
                                }}
                              >
                                <SelectTrigger className="w-full bg-black/50 border-white/10 text-white text-xs uppercase tracking-widest font-bold cursor-none focus:ring-warning focus:border-warning">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl cursor-none">
                                  <SelectItem value="Available" className="cursor-none uppercase tracking-widest text-[10px] font-bold text-white hover:text-black">Available</SelectItem>
                                  <SelectItem value="On Trip" className="cursor-none uppercase tracking-widest text-[10px] font-bold text-white hover:text-black">On Trip</SelectItem>
                                  <SelectItem value="In Shop" className="cursor-none uppercase tracking-widest text-[10px] font-bold text-white hover:text-black">In Shop</SelectItem>
                                  <SelectItem value="Retired" className="cursor-none uppercase tracking-widest text-[10px] font-bold text-white hover:text-black">Retired</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs updated for cinematic style */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass border border-primary/20 bg-black/90 p-8 rounded-3xl cursor-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter text-glow">Log New Service</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Target Asset</Label>
              <Select value={serviceFormData.vehicleId} onValueChange={(v) => setServiceFormData({ ...serviceFormData, vehicleId: v })}>
                <SelectTrigger className="bg-black/50 border-white/10 text-white focus:ring-primary cursor-none uppercase text-xs tracking-widest">
                  <SelectValue placeholder="Select Asset" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl cursor-none">
                  {vehicles.filter(v => v.status !== "Retired" && v.status !== "On Trip").map(v => (
                    <SelectItem key={v.id} value={v.id} className="cursor-none hover:bg-primary hover:text-black uppercase text-xs tracking-widest">{v.name} - {v.status}</SelectItem>
                  ))}
                  {vehicles.filter(v => v.status !== "Retired" && v.status !== "On Trip").length === 0 && (
                    <SelectItem value="none" disabled className="text-white/40 uppercase text-xs">No valid assets</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Service Type</Label>
              <Input id="type" placeholder="e.g. Oil Change" value={serviceFormData.type} onChange={e => setServiceFormData({ ...serviceFormData, type: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Details</Label>
              <Input id="desc" value={serviceFormData.description} onChange={e => setServiceFormData({ ...serviceFormData, description: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Total Cost ($)</Label>
                <Input id="cost" type="number" value={serviceFormData.cost} onChange={e => setServiceFormData({ ...serviceFormData, cost: parseInt(e.target.value) })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Date</Label>
                <Input id="date" type="date" value={serviceFormData.date} onChange={e => setServiceFormData({ ...serviceFormData, date: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none font-mono text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-8 pt-6 border-t border-white/10">
            <Button onClick={handleCreateService} className="w-full bg-primary hover:bg-primary/80 text-black font-black uppercase tracking-[0.2em] transition-all h-12 cursor-none">Commit Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass border border-primary/20 bg-black/90 p-8 rounded-3xl cursor-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter text-glow">{isEditingDriver ? "Update Profile" : "Onboard Personnel"}</DialogTitle>
            <DialogDescription className="text-white/40 uppercase tracking-widest text-[10px] font-bold mt-2">Manage credentials and operational status.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="d_name" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Official Name</Label>
              <Input id="d_name" value={driverFormData.name} onChange={e => setDriverFormData({ ...driverFormData, name: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d_phone" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Comms Link (Phone)</Label>
              <Input id="d_phone" value={driverFormData.phone} onChange={e => setDriverFormData({ ...driverFormData, phone: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none font-mono tracking-widest" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d_expiry" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Certification Expiry</Label>
              <Input id="d_expiry" type="date" value={driverFormData.licenseExpiry} onChange={e => setDriverFormData({ ...driverFormData, licenseExpiry: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none font-mono text-sm" />
            </div>
            {isEditingDriver && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="d_score" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Safety Score</Label>
                  <Input id="d_score" type="number" min={0} max={100} value={driverFormData.safetyScore} onChange={e => setDriverFormData({ ...driverFormData, safetyScore: parseInt(e.target.value) })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary transition-all cursor-none font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d_status" className="text-white/60 uppercase tracking-widest text-[10px] font-bold">Status Force</Label>
                  <Select value={driverFormData.status} onValueChange={(v) => setDriverFormData({ ...driverFormData, status: v as DriverStatus })}>
                    <SelectTrigger className="bg-black/50 border-white/10 text-white focus:ring-primary cursor-none uppercase text-xs tracking-widest">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl cursor-none">
                      <SelectItem value="On Duty" className="cursor-none hover:bg-primary hover:text-black uppercase text-[10px] tracking-widest font-bold">On Duty</SelectItem>
                      <SelectItem value="Off Duty" className="cursor-none hover:bg-primary hover:text-black uppercase text-[10px] tracking-widest font-bold">Off Duty</SelectItem>
                      <SelectItem value="Suspended" className="cursor-none hover:bg-primary hover:text-black uppercase text-[10px] tracking-widest font-bold">Suspended</SelectItem>
                      <SelectItem value="On Trip" className="cursor-none hover:bg-primary hover:text-black uppercase text-[10px] tracking-widest font-bold" disabled>On Trip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-8 pt-6 border-t border-white/10">
            <Button onClick={handleSaveDriver} className="w-full bg-primary hover:bg-primary/80 text-black font-black uppercase tracking-[0.2em] transition-all h-12 cursor-none text-glow shadow-[0_0_15px_rgba(204,255,0,0.2)]">
              {isEditingDriver ? "Finalize Update" : "Approve Hiring"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
