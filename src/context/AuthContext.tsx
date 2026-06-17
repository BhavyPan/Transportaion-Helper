import React, { createContext, useContext, useState, useEffect } from "react";
import { getSupabaseConfigError, supabase } from "@/lib/supabase";

export type Role = "Manager" | "Dispatcher" | "Safety Officer" | "Finance";

export interface User {
    id: string;
    email: string;
    password?: string;
    name: string;
    role: Role;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string) => Promise<{ success: boolean, error?: string }>;
    signup: (email: string, password: string, name: string, role: Role) => Promise<{ success: boolean, error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ProfileRow = {
    id: string;
    email: string;
    name: string;
    role: Role;
};

const toUser = (profile: ProfileRow): User => ({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async (userId: string) => {
            if (!supabase) {
                return null;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("id,email,name,role")
                .eq("id", userId)
                .single();

            if (error || !data) {
                console.error("Failed to load user profile", error);
                return null;
            }

            return toUser(data as ProfileRow);
        };

        const initializeAuth = async () => {
            if (!supabase) {
                setLoading(false);
                return;
            }

            const { data } = await supabase.auth.getSession();
            const sessionUser = data.session?.user;

            if (sessionUser && isMounted) {
                setUser(await loadProfile(sessionUser.id));
            }

            if (isMounted) {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: listener } = supabase?.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) return;

            if (!session?.user) {
                setUser(null);
                return;
            }

            setUser(await loadProfile(session.user.id));
        }) ?? { data: null };

        return () => {
            isMounted = false;
            listener?.subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password?: string) => {
        if (!supabase) {
            return { success: false, error: getSupabaseConfigError() };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password ?? "",
        });

        if (error || !data.user) {
            return { success: false, error: error?.message ?? "Invalid email or password." };
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id,email,name,role")
            .eq("id", data.user.id)
            .single();

        if (profileError || !profile) {
            return { success: false, error: profileError?.message ?? "Unable to load user profile." };
        }

        setUser(toUser(profile as ProfileRow));
        return { success: true };
    };

    const signup = async (email: string, password: string, name: string, role: Role) => {
        if (!supabase) {
            return { success: false, error: getSupabaseConfigError() };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role },
            },
        });

        if (error || !data.user) {
            return { success: false, error: error?.message ?? "Unable to create account." };
        }

        if (!data.session) {
            return { success: false, error: "Account created. Confirm your email, then sign in." };
        }

        const profile: User = {
            id: data.user.id,
            email,
            name,
            role,
        };

        const { error: profileError } = await supabase.from("profiles").upsert(profile);
        if (profileError) {
            return { success: false, error: profileError.message };
        }

        setUser(profile);
        return { success: true };
    };

    const logout = async () => {
        await supabase?.auth.signOut();
        setUser(null);
    };

    if (loading) {
        return null; // Or a loading spinner
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
