export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type VehicleType = "Truck" | "Van" | "Bike";
export type DriverStatus = "On Duty" | "Off Duty" | "Suspended" | "On Trip";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  licensePlate: string;
  maxCapacity: number;
  odometer: number;
  status: VehicleStatus;
  region: string;
  lastService: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseExpiry: string;
  licenseCategories: VehicleType[];
  status: DriverStatus;
  safetyScore: number;
  tripsCompleted: number;
  phone: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  cargoWeight: number;
  status: TripStatus;
  createdAt: string;
  completedAt?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  cost: number;
  date: string;
  status: "Scheduled" | "In Progress" | "Completed";
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
  odometer: number;
}

export const vehicles: Vehicle[] = [];

export const drivers: Driver[] = [];

export const trips: Trip[] = [];

export const maintenanceLogs: MaintenanceLog[] = [];

export const fuelLogs: FuelLog[] = [];

export function getVehicleName(vehicleId: string): string {
  return vehicles.find(v => v.id === vehicleId)?.name ?? "Unknown";
}

export function getDriverName(driverId: string): string {
  return drivers.find(d => d.id === driverId)?.name ?? "Unknown";
}
