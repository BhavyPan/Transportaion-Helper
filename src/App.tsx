import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AppLayout, { ProtectedRoute, RoleProtectedRoute } from "@/components/AppLayout";
import { AuthProvider } from "@/context/AuthContext";
import { FleetProvider } from "@/context/FleetContext";
import Index from "./pages/Index";
import Vehicles from "./pages/Vehicles";
import Trips from "./pages/Trips";
import Drivers from "./pages/Drivers";
import Maintenance from "./pages/Maintenance";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AnimatePresence, motion } from "framer-motion";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <Login />
          </motion.div>
        } />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* Command Center: All Roles */}
          <Route path="/" element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Index />
            </motion.div>
          } />

          {/* Vehicle Registry: Manager, Dispatcher, Safety Officer */}
          <Route path="/vehicles" element={
            <RoleProtectedRoute allowedRoles={["Manager", "Dispatcher", "Safety Officer"]}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <Vehicles />
              </motion.div>
            </RoleProtectedRoute>
          } />

          {/* Trip Dispatcher: Manager, Dispatcher */}
          <Route path="/trips" element={
            <RoleProtectedRoute allowedRoles={["Manager", "Dispatcher"]}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <Trips />
              </motion.div>
            </RoleProtectedRoute>
          } />

          {/* Driver Profiles: Manager, Dispatcher, Safety Officer */}
          <Route path="/drivers" element={
            <RoleProtectedRoute allowedRoles={["Manager", "Dispatcher", "Safety Officer"]}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <Drivers />
              </motion.div>
            </RoleProtectedRoute>
          } />

          {/* Maintenance: Manager, Safety Officer */}
          <Route path="/maintenance" element={
            <RoleProtectedRoute allowedRoles={["Manager", "Safety Officer"]}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <Maintenance />
              </motion.div>
            </RoleProtectedRoute>
          } />

          {/* Analytics: Manager, Finance */}
          <Route path="/analytics" element={
            <RoleProtectedRoute allowedRoles={["Manager", "Finance"]}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <Analytics />
              </motion.div>
            </RoleProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FleetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </FleetProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
