"use client";

import { create } from "zustand";
import { User } from "@/lib/types";
import {
  saveUser,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  clearAllData,
} from "@/lib/db";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  serverHost: string;
  password: string; // Stored temporarily for API calls
  
  // Actions
  login: (user: User, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setServerHost: (host: string) => void;
  setPassword: (password: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  serverHost: "http://localhost:8000",
  password: "",

  login: async (user: User, password: string) => {
    await saveUser(user);
    await setCurrentUser(user.username);
    set({ user, isAuthenticated: true, password });
  },

  logout: async () => {
    await clearCurrentUser();
    set({ user: null, isAuthenticated: false, password: "" });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      if (user) {
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  setServerHost: (host: string) => {
    set({ serverHost: host });
  },

  setPassword: (password: string) => {
    set({ password });
  },
}));
