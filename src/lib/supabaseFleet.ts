import type { Driver, FuelLog, MaintenanceLog, Trip, Vehicle } from "@/data/mockData";
import { getSupabaseConfigError, supabase } from "@/lib/supabase";

type VehicleRow = {
  id: string;
  name: string;
  type: Vehicle["type"];
  license_plate: string;
  max_capacity: number;
  odometer: number;
  status: Vehicle["status"];
  region: string;
  last_service: string;
};

type DriverRow = {
  id: string;
  name: string;
  license_expiry: string;
  license_categories: Driver["licenseCategories"];
  status: Driver["status"];
  safety_score: number;
  trips_completed: number;
  phone: string;
};

type TripRow = {
  id: string;
  vehicle_id: string;
  driver_id: string;
  origin: string;
  destination: string;
  cargo_weight: number;
  status: Trip["status"];
  created_at: string;
  completed_at: string | null;
};

type MaintenanceLogRow = {
  id: string;
  vehicle_id: string;
  type: string;
  description: string;
  cost: number;
  date: string;
  status: MaintenanceLog["status"];
};

type FuelLogRow = {
  id: string;
  vehicle_id: string;
  liters: number;
  cost: number;
  date: string;
  odometer: number;
};

export type FleetSnapshot = {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
};

const toVehicle = (row: VehicleRow): Vehicle => ({
  id: row.id,
  name: row.name,
  type: row.type,
  licensePlate: row.license_plate,
  maxCapacity: row.max_capacity,
  odometer: row.odometer,
  status: row.status,
  region: row.region,
  lastService: row.last_service,
});

const fromVehicle = (vehicle: Vehicle): VehicleRow => ({
  id: vehicle.id,
  name: vehicle.name,
  type: vehicle.type,
  license_plate: vehicle.licensePlate,
  max_capacity: vehicle.maxCapacity,
  odometer: vehicle.odometer,
  status: vehicle.status,
  region: vehicle.region,
  last_service: vehicle.lastService,
});

const toDriver = (row: DriverRow): Driver => ({
  id: row.id,
  name: row.name,
  licenseExpiry: row.license_expiry,
  licenseCategories: row.license_categories,
  status: row.status,
  safetyScore: row.safety_score,
  tripsCompleted: row.trips_completed,
  phone: row.phone,
});

const fromDriver = (driver: Driver): DriverRow => ({
  id: driver.id,
  name: driver.name,
  license_expiry: driver.licenseExpiry,
  license_categories: driver.licenseCategories,
  status: driver.status,
  safety_score: driver.safetyScore,
  trips_completed: driver.tripsCompleted,
  phone: driver.phone,
});

const toTrip = (row: TripRow): Trip => ({
  id: row.id,
  vehicleId: row.vehicle_id,
  driverId: row.driver_id,
  origin: row.origin,
  destination: row.destination,
  cargoWeight: row.cargo_weight,
  status: row.status,
  createdAt: row.created_at,
  completedAt: row.completed_at ?? undefined,
});

const fromTrip = (trip: Trip): TripRow => ({
  id: trip.id,
  vehicle_id: trip.vehicleId,
  driver_id: trip.driverId,
  origin: trip.origin,
  destination: trip.destination,
  cargo_weight: trip.cargoWeight,
  status: trip.status,
  created_at: trip.createdAt,
  completed_at: trip.completedAt ?? null,
});

const toMaintenanceLog = (row: MaintenanceLogRow): MaintenanceLog => ({
  id: row.id,
  vehicleId: row.vehicle_id,
  type: row.type,
  description: row.description,
  cost: row.cost,
  date: row.date,
  status: row.status,
});

const fromMaintenanceLog = (log: MaintenanceLog): MaintenanceLogRow => ({
  id: log.id,
  vehicle_id: log.vehicleId,
  type: log.type,
  description: log.description,
  cost: log.cost,
  date: log.date,
  status: log.status,
});

const toFuelLog = (row: FuelLogRow): FuelLog => ({
  id: row.id,
  vehicleId: row.vehicle_id,
  liters: row.liters,
  cost: row.cost,
  date: row.date,
  odometer: row.odometer,
});

const fromFuelLog = (log: FuelLog): FuelLogRow => ({
  id: log.id,
  vehicle_id: log.vehicleId,
  liters: log.liters,
  cost: log.cost,
  date: log.date,
  odometer: log.odometer,
});

function requireSupabase() {
  if (!supabase) {
    throw new Error(getSupabaseConfigError());
  }

  return supabase;
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchFleetSnapshot(): Promise<FleetSnapshot> {
  const client = requireSupabase();
  const [
    vehiclesResult,
    driversResult,
    tripsResult,
    maintenanceLogsResult,
    fuelLogsResult,
  ] = await Promise.all([
    client.from("vehicles").select("*").order("created_at", { ascending: true }),
    client.from("drivers").select("*").order("created_at", { ascending: true }),
    client.from("trips").select("*").order("created_at", { ascending: false }),
    client.from("maintenance_logs").select("*").order("created_at", { ascending: false }),
    client.from("fuel_logs").select("*").order("created_at", { ascending: false }),
  ]);

  [
    vehiclesResult.error,
    driversResult.error,
    tripsResult.error,
    maintenanceLogsResult.error,
    fuelLogsResult.error,
  ].forEach(throwIfError);

  return {
    vehicles: ((vehiclesResult.data ?? []) as VehicleRow[]).map(toVehicle),
    drivers: ((driversResult.data ?? []) as DriverRow[]).map(toDriver),
    trips: ((tripsResult.data ?? []) as TripRow[]).map(toTrip),
    maintenanceLogs: ((maintenanceLogsResult.data ?? []) as MaintenanceLogRow[]).map(toMaintenanceLog),
    fuelLogs: ((fuelLogsResult.data ?? []) as FuelLogRow[]).map(toFuelLog),
  };
}

export async function upsertVehicle(vehicle: Vehicle) {
  const { error } = await requireSupabase().from("vehicles").upsert(fromVehicle(vehicle));
  throwIfError(error);
}

export async function removeVehicle(id: string) {
  const { error } = await requireSupabase().from("vehicles").delete().eq("id", id);
  throwIfError(error);
}

export async function upsertDriver(driver: Driver) {
  const { error } = await requireSupabase().from("drivers").upsert(fromDriver(driver));
  throwIfError(error);
}

export async function removeDriver(id: string) {
  const { error } = await requireSupabase().from("drivers").delete().eq("id", id);
  throwIfError(error);
}

export async function upsertTrip(trip: Trip) {
  const { error } = await requireSupabase().from("trips").upsert(fromTrip(trip));
  throwIfError(error);
}

export async function updateTripRows(trips: Trip[]) {
  const { error } = await requireSupabase().from("trips").upsert(trips.map(fromTrip));
  throwIfError(error);
}

export async function updateVehicleRows(vehicles: Vehicle[]) {
  const { error } = await requireSupabase().from("vehicles").upsert(vehicles.map(fromVehicle));
  throwIfError(error);
}

export async function updateDriverRows(drivers: Driver[]) {
  const { error } = await requireSupabase().from("drivers").upsert(drivers.map(fromDriver));
  throwIfError(error);
}

export async function upsertMaintenanceLog(log: MaintenanceLog) {
  const { error } = await requireSupabase().from("maintenance_logs").upsert(fromMaintenanceLog(log));
  throwIfError(error);
}

export async function updateMaintenanceRows(logs: MaintenanceLog[]) {
  const { error } = await requireSupabase().from("maintenance_logs").upsert(logs.map(fromMaintenanceLog));
  throwIfError(error);
}

export async function upsertFuelLog(log: FuelLog) {
  const { error } = await requireSupabase().from("fuel_logs").upsert(fromFuelLog(log));
  throwIfError(error);
}
