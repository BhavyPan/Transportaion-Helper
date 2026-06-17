import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Truck,
  Route,
  Users,
  Wrench,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, Role } from "@/context/AuthContext";

type NavItem = {
  to: string;
  icon: any;
  label: string;
  allowedRoles: Role[];
};

const navItems: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Command Center", allowedRoles: ["Manager", "Dispatcher", "Safety Officer", "Finance"] },
  { to: "/vehicles", icon: Truck, label: "Vehicle Registry", allowedRoles: ["Manager", "Dispatcher", "Safety Officer"] },
  { to: "/trips", icon: Route, label: "Trip Dispatcher", allowedRoles: ["Manager", "Dispatcher"] },
  { to: "/drivers", icon: Users, label: "Driver Profiles", allowedRoles: ["Manager", "Dispatcher", "Safety Officer"] },
  { to: "/maintenance", icon: Wrench, label: "Maintenance", allowedRoles: ["Manager", "Safety Officer"] },
  { to: "/analytics", icon: BarChart3, label: "Analytics", allowedRoles: ["Manager", "Finance"] },
];

export function TopNav() {
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter(item =>
    user && item.allowedRoles.includes(user.role)
  );

  return (
    <nav className="flex items-center gap-1 sm:gap-4 lg:gap-8">
      {filteredNavItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            data-active={isActive}
            className={cn(
              "group relative flex items-center justify-center rounded-xl p-2 lg:px-4 lg:py-2 text-xs font-black uppercase tracking-[0.2em] transition-all cursor-none overflow-hidden",
              "before:absolute before:inset-0 before:rounded-xl before:bg-white/0 before:transition-colors hover:before:bg-white/[0.055]",
              "after:absolute after:left-3 after:right-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-primary after:to-cyan-300 after:transition-transform hover:after:scale-x-100",
              isActive ? "text-primary bg-primary/[0.055] shadow-[inset_0_0_18px_rgba(204,255,0,0.06)]" : "text-white/40 hover:text-white"
            )}
          >
            <span className="relative z-10 hidden md:block">{item.label}</span>
            <span className="relative z-10 block md:hidden"><item.icon className="h-5 w-5" /></span>

            {isActive && (
              <motion.div
                layoutId="topnav-active"
                className="absolute inset-x-0 -bottom-3 h-[2px] bg-primary rounded-full shadow-[0_0_15px_#ccff00]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
