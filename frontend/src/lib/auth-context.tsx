"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import type { RegisterInput, User, VerifyEmailInput } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<{ email: string }>;
  verifyEmail: (data: VerifyEmailInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!api.hasTokens()) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    api
      .getMe()
      .then(setUser)
      .catch(() => {
        api.clearTokens();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await api.login({ email, password });
    const me = await api.getMe();
    setUser(me);
    router.push("/dashboard");
  };

  const register = async (data: RegisterInput): Promise<{ email: string }> => {
    const result = await api.register(data);
    return { email: result.email };
  };

  const verifyEmail = async (data: VerifyEmailInput): Promise<void> => {
    const result = await api.verifyEmail(data);
    const me = await api.getMe();
    setUser(me);
    void result;
    router.push("/dashboard");
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, verifyEmail, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
