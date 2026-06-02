import { create } from "zustand";
import { api, tokenStore } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    full_name: string;
    password: string;
    password_confirm: string;
  }) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",

  login: async (email, password) => {
    set({ status: "loading" });
    const { data } = await api.post("/auth/login/", { email, password });
    tokenStore.set({ access: data.access, refresh: data.refresh });
    await get().fetchMe();
  },

  register: async (payload) => {
    set({ status: "loading" });
    const { data } = await api.post("/auth/register/", payload);
    tokenStore.set(data.tokens);
    set({ user: data.user, status: "authenticated" });
  },

  fetchMe: async () => {
    if (!tokenStore.access) {
      set({ status: "unauthenticated" });
      return;
    }
    set({ status: "loading" });
    try {
      const { data } = await api.get("/auth/me/");
      set({ user: data, status: "authenticated" });
    } catch {
      tokenStore.clear();
      set({ user: null, status: "unauthenticated" });
    }
  },

  logout: () => {
    tokenStore.clear();
    set({ user: null, status: "unauthenticated" });
  },

  setUser: (user) => set({ user }),
}));
