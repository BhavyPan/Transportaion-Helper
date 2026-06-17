import { cn } from "@/lib/utils";
import type { VehicleStatus, DriverStatus, TripStatus } from "@/data/mockData";

const vehicleStatusMap: Record<VehicleStatus, string> = {
  Available: "status-available",
  "On Trip": "status-on-trip",
  "In Shop": "status-in-shop",
  Retired: "status-retired",
};

const driverStatusMap: Record<DriverStatus, string> = {
  "On Duty": "status-available",
  "Off Duty": "status-retired",
  Suspended: "status-suspended",
  "On Trip": "status-on-trip",
};

const tripStatusMap: Record<TripStatus, string> = {
  Draft: "status-retired",
  Dispatched: "status-on-trip",
  Completed: "status-available",
  Cancelled: "status-suspended",
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return <span className={cn(vehicleStatusMap[status])}>{status}</span>;
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  return <span className={cn(driverStatusMap[status])}>{status}</span>;
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return <span className={cn(tripStatusMap[status])}>{status}</span>;
}
