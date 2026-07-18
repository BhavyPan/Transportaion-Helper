import React, { createContext, useContext, useState, useEffect } from "react";
import { getSupabaseConfigError, supabase } from "@/lib/supabase";
import {
    clearPendingGoogleLogin,
    markGoogleLoginPending,
    recordSuccessfulLogin,
} from "@/lib/visitorAnalytics";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

export type Role = "User" | "Manager" | "Dispatcher" | "Safety Officer" | "Finance";

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string) => Promise<{ success: boolean, error?: string }>;
    loginWithGoogle: () => Promise<{ success: boolean, error?: string }>;
    signup: (email: string, password: string, name: string) => Promise<{ success: boolean, error?: string }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ProfileRow = {
    id: string;
    email: string;
    name: string;
    role: Role;
};

const getAvatarUrl = (authUser: SupabaseAuthUser) => {
    const avatarUrl = authUser.user_metadata.avatar_url ?? authUser.user_metadata.picture;
    return typeof avatarUrl === "string" ? avatarUrl : undefined;
};

const getDisplayName = (authUser: SupabaseAuthUser) => {
    const displayName = authUser.user_metadata.full_name ?? authUser.user_metadata.name;
    if (typeof displayName === "string" && displayName.trim()) return displayName.trim();
    return authUser.email?.split("@")[0] || "Transportation Helper User";
};

const toUser = (profile: ProfileRow, authUser: SupabaseAuthUser): User => ({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    avatarUrl: getAvatarUrl(authUser),
});

function recordLoginAnalytics(userId: string) {
    void recordSuccessfulLogin(userId).catch(error => {
        console.error("Login analytics error:", error);
    });
}

async function loadProfile(authUser: SupabaseAuthUser) {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("profiles")
        .select("id,email,name,role")
        .eq("id", authUser.id)
        .maybeSingle();

    if (error) {
        console.error("Failed to load user profile", error);
        return null;
    }

    if (data) return toUser(data as ProfileRow, authUser);

    if (!authUser.email) {
        console.error("Cannot create a profile without an authenticated email");
        return null;
    }

    const safeProfile: ProfileRow = {
        id: authUser.id,
        email: authUser.email,
        name: getDisplayName(authUser),
        role: "User",
    };
    const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert(safeProfile)
        .select("id,email,name,role")
        .single();

    if (createError || !createdProfile) {
        console.error("Failed to create a safe user profile", createError);
        return null;
    }

    return toUser(createdProfile as ProfileRow, authUser);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            if (!supabase) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.getUser();

            if (error) {
                console.error("Failed to validate the current session", error);
            }

            if (data.user && isMounted) {
                setUser(await loadProfile(data.user));
            }

            if (isMounted) {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;

            if (!session?.user) {
                setUser(null);
                return;
            }

            void loadProfile(session.user).then(profile => {
                if (isMounted) setUser(profile);
            });
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

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: password ?? "",
        });

        if (error) {
            console.error("Email login failed", error);
            return { success: false, error: "Invalid email or password." };
        }

        const { data: validatedUser, error: validationError } = await supabase.auth.getUser();

        if (validationError || !validatedUser.user) {
            console.error("Unable to validate email login", validationError);
            return { success: false, error: "Unable to validate your account." };
        }

        const profile = await loadProfile(validatedUser.user);
        if (!profile) return { success: false, error: "Unable to load your user profile." };

        recordLoginAnalytics(validatedUser.user.id);
        setUser(profile);
        return { success: true };
    };

    const loginWithGoogle = async () => {
        if (!supabase) {
            return { success: false, error: getSupabaseConfigError() };
        }

        markGoogleLoginPending();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            clearPendingGoogleLogin();
            console.error("Google OAuth failed to start", error);
            return { success: false, error: "Unable to start Google sign-in. Please try again." };
        }

        return { success: true };
    };

    const signup = async (email: string, password: string, name: string) => {
        if (!supabase) {
            return { success: false, error: getSupabaseConfigError() };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error || !data.user) {
            console.error("Email signup failed", error);
            return { success: false, error: "Unable to create account. Check your details and try again." };
        }

        if (!data.session) {
            return { success: false, error: "Account created. Confirm your email, then sign in." };
        }

        const profile = await loadProfile(data.user);
        if (!profile) return { success: false, error: "Unable to create your user profile." };

        recordLoginAnalytics(data.user.id);
        setUser(profile);
        return { success: true };
    };

    const logout = async () => {
        const { error } = await supabase?.auth.signOut() ?? { error: null };
        if (error) console.error("Logout failed", error);
        setUser(null);
    };

    if (loading) {
        return null; // Or a loading spinner
    }

    return (
        <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout, isAuthenticated: !!user }}>
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
