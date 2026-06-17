import React, { createContext, useContext, useState, useEffect } from "react";
import {
    Vehicle,
    Driver,
    Trip,
    MaintenanceLog,
    FuelLog,
    VehicleStatus,
    TripStatus,
    DriverStatus,
} from "@/data/mockData";
import {
    fetchFleetSnapshot,
    removeDriver,
    removeVehicle,
    updateDriverRows,
    updateMaintenanceRows,
    updateTripRows,
    updateVehicleRows,
    upsertDriver,
    upsertFuelLog,
    upsertMaintenanceLog,
    upsertTrip,
    upsertVehicle,
} from "@/lib/supabaseFleet";
import { useAuth } from "@/context/AuthContext";

interface FleetContextType {
    vehicles: Vehicle[];
    drivers: Driver[];
    trips: Trip[];
    maintenanceLogs: MaintenanceLog[];
    fuelLogs: FuelLog[];

    // Vehicle Mutations
    addVehicle: (vehicle: Vehicle) => void;
    updateVehicle: (vehicle: Vehicle) => void;
    deleteVehicle: (id: string) => void;
    updateVehicleStatus: (id: string, status: VehicleStatus) => void;

    // Driver Mutations
    addDriver: (driver: Driver) => void;
    updateDriver: (driver: Driver) => void;
    deleteDriver: (id: string) => void;

    // Trip Mutations
    createTrip: (trip: Trip) => void;
    startTrip: (tripId: string) => void;
    completeTrip: (tripId: string, finalOdometer: number) => void;

    // Logs
    addMaintenanceLog: (log: MaintenanceLog) => void;
    completeMaintenanceLog: (logId: string) => void;
    addFuelLog: (log: FuelLog) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

const localStorageKeys = [
    "fleetData_vehicles",
    "fleetData_drivers",
    "fleetData_trips",
    "fleetData_maintenanceLogs",
    "fleetData_fuelLogs",
] as const;

function readStoredArray<T>(key: string): T[] {
    const value = localStorage.getItem(key);
    if (!value) return [];

    try {
        return JSON.parse(value) as T[];
    } catch (error) {
        console.error(`Failed to parse ${key}`, error);
        return [];
    }
}

async function migrateLocalFleetData() {
    const localVehicles = readStoredArray<Vehicle>("fleetData_vehicles");
    const localDrivers = readStoredArray<Driver>("fleetData_drivers");
    const localTrips = readStoredArray<Trip>("fleetData_trips");
    const localMaintenanceLogs = readStoredArray<MaintenanceLog>("fleetData_maintenanceLogs");
    const localFuelLogs = readStoredArray<FuelLog>("fleetData_fuelLogs");

    const hasLocalData = [
        localVehicles,
        localDrivers,
        localTrips,
        localMaintenanceLogs,
        localFuelLogs,
    ].some(collection => collection.length > 0);

    if (!hasLocalData) return;

    await Promise.all([
        localVehicles.length ? updateVehicleRows(localVehicles) : Promise.resolve(),
        localDrivers.length ? updateDriverRows(localDrivers) : Promise.resolve(),
        localTrips.length ? updateTripRows(localTrips) : Promise.resolve(),
        localMaintenanceLogs.length ? updateMaintenanceRows(localMaintenanceLogs) : Promise.resolve(),
        ...localFuelLogs.map(upsertFuelLog),
    ]);

    localStorageKeys.forEach(key => localStorage.removeItem(key));
}

export function FleetProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
    const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);

    useEffect(() => {
        let isMounted = true;

        if (!isAuthenticated) {
            setVehicles([]);
            setDrivers([]);
            setTrips([]);
            setMaintenanceLogs([]);
            setFuelLogs([]);
            return;
        }

        migrateLocalFleetData()
            .then(fetchFleetSnapshot)
            .then(snapshot => {
                if (!isMounted) return;
                setVehicles(snapshot.vehicles);
                setDrivers(snapshot.drivers);
                setTrips(snapshot.trips);
                setMaintenanceLogs(snapshot.maintenanceLogs);
                setFuelLogs(snapshot.fuelLogs);
            })
            .catch(error => console.error("Failed to load fleet data from Supabase", error));

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated]);

    const persist = (operation: Promise<unknown>) => {
        operation.catch(error => console.error("Failed to save fleet data to Supabase", error));
    };

    // Vehicle Mutations
    const addVehicle = (vehicle: Vehicle) => {
        setVehicles(prev => [...prev, vehicle]);
        persist(upsertVehicle(vehicle));
    };

    const updateVehicle = (vehicle: Vehicle) => {
        setVehicles(prev => prev.map(v => v.id === vehicle.id ? vehicle : v));
        persist(upsertVehicle(vehicle));
    };

    const deleteVehicle = (id: string) => {
        setVehicles(prev => prev.filter(v => v.id !== id));
        persist(removeVehicle(id));
    };

    const updateVehicleStatus = (id: string, status: VehicleStatus) => {
        const nextVehicle = vehicles.find(v => v.id === id);
        if (!nextVehicle) return;

        const updatedVehicle = { ...nextVehicle, status };
        setVehicles(prev => prev.map(v => v.id === id ? updatedVehicle : v));
        persist(upsertVehicle(updatedVehicle));
    };

    // Driver Mutations
    const addDriver = (driver: Driver) => {
        setDrivers(prev => [...prev, driver]);
        persist(upsertDriver(driver));
    };

    const updateDriver = (driver: Driver) => {
        setDrivers(prev => prev.map(d => d.id === driver.id ? driver : d));
        persist(upsertDriver(driver));
    };

    const deleteDriver = (id: string) => {
        setDrivers(prev => prev.filter(d => d.id !== id));
        persist(removeDriver(id));
    };

    // Trip Mutations
    const createTrip = (trip: Trip) => {
        setTrips(prev => [trip, ...prev]);
        persist(upsertTrip(trip));
    };

    const startTrip = (tripId: string) => {
        const tripToStart = trips.find(t => t.id === tripId);
        if (!tripToStart) return;

        const updatedTrips = trips.map(t => t.id === tripId ? { ...t, status: "Dispatched" as TripStatus } : t);
        const updatedVehicles = vehicles.map(v => v.id === tripToStart.vehicleId ? { ...v, status: "On Trip" as VehicleStatus } : v);
        const updatedDrivers = drivers.map(d => d.id === tripToStart.driverId ? { ...d, status: "On Trip" as DriverStatus } : d);

        setTrips(updatedTrips);
        setVehicles(updatedVehicles);
        setDrivers(updatedDrivers);
        persist(Promise.all([
            updateTripRows(updatedTrips.filter(t => t.id === tripId)),
            updateVehicleRows(updatedVehicles.filter(v => v.id === tripToStart.vehicleId)),
            updateDriverRows(updatedDrivers.filter(d => d.id === tripToStart.driverId)),
        ]));
    };

    const completeTrip = (tripId: string, finalOdometer: number) => {
        const tripToComplete = trips.find(t => t.id === tripId);
        if (!tripToComplete) return;

        const updatedTrips = trips.map(t => t.id === tripId ? { ...t, status: "Completed" as TripStatus, completedAt: new Date().toISOString() } : t);
        const updatedVehicles = vehicles.map(v => v.id === tripToComplete.vehicleId ? { ...v, status: "Available" as VehicleStatus, odometer: Math.max(v.odometer, finalOdometer) } : v);
        const updatedDrivers = drivers.map(d => d.id === tripToComplete.driverId ? { ...d, status: "On Duty" as DriverStatus, tripsCompleted: d.tripsCompleted + 1 } : d);

        setTrips(updatedTrips);
        setVehicles(updatedVehicles);
        setDrivers(updatedDrivers);
        persist(Promise.all([
            updateTripRows(updatedTrips.filter(t => t.id === tripId)),
            updateVehicleRows(updatedVehicles.filter(v => v.id === tripToComplete.vehicleId)),
            updateDriverRows(updatedDrivers.filter(d => d.id === tripToComplete.driverId)),
        ]));
    };

    const addMaintenanceLog = (log: MaintenanceLog) => {
        const updatedVehicles = vehicles.map(v => v.id === log.vehicleId ? { ...v, status: "In Shop" as VehicleStatus } : v);
        setMaintenanceLogs(prev => [log, ...prev]);
        setVehicles(updatedVehicles);
        persist(Promise.all([
            upsertMaintenanceLog(log),
            updateVehicleRows(updatedVehicles.filter(v => v.id === log.vehicleId)),
        ]));
    };

    const completeMaintenanceLog = (logId: string) => {
        const logToComplete = maintenanceLogs.find(l => l.id === logId);
        if (!logToComplete) return;

        const updatedLogs = maintenanceLogs.map(l => l.id === logId ? { ...l, status: "Completed" as const } : l);
        const updatedVehicles = vehicles.map(v => v.id === logToComplete.vehicleId ? { ...v, status: "Available" as VehicleStatus } : v);

        setMaintenanceLogs(updatedLogs);
        setVehicles(updatedVehicles);
        persist(Promise.all([
            updateMaintenanceRows(updatedLogs.filter(l => l.id === logId)),
            updateVehicleRows(updatedVehicles.filter(v => v.id === logToComplete.vehicleId)),
        ]));
    };

    const addFuelLog = (log: FuelLog) => {
        const updatedVehicles = vehicles.map(v => v.id === log.vehicleId ? { ...v, status: "Available" as VehicleStatus } : v);
        setFuelLogs(prev => [log, ...prev]);
        setVehicles(updatedVehicles);
        persist(Promise.all([
            upsertFuelLog(log),
            updateVehicleRows(updatedVehicles.filter(v => v.id === log.vehicleId)),
        ]));
    };

    return (
        <FleetContext.Provider value={{
            vehicles, drivers, trips, maintenanceLogs, fuelLogs,
            addVehicle, updateVehicle, deleteVehicle, updateVehicleStatus,
            addDriver, updateDriver, deleteDriver,
            createTrip, startTrip, completeTrip,
            addMaintenanceLog, completeMaintenanceLog, addFuelLog
        }}>
            {children}
        </FleetContext.Provider>
    );
}

export function useFleet() {
    const context = useContext(FleetContext);
    if (context === undefined) {
        throw new Error("useFleet must be used within a FleetProvider");
    }
    return context;
}
