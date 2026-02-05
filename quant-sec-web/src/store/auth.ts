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
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setServerHost: (host: string) => void;
  setPassword: (password: string) => void;
}

import api from "@/lib/api";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  serverHost: "http://localhost:8000",
  password: "",

  login: async (username: string, password: string) => {
    api.setBaseURL(get().serverHost);
    const response = await api.login(username, password);
    
    if (response.Status !== "Positive") {
      throw new Error(response.Message || "Login failed");
    }
    
    const user: User = {
      username: response.user.username,
      name: response.user.name,
      publicKey: response.user.public_key,
      privateKey: response.user.private_key,
      serverHost: get().serverHost,
    };
    
    await saveUser(user);
    await setCurrentUser(user.username);
    // Save password to sessionStorage for persistence during session
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth_password", password);
    }
    set({ user, isAuthenticated: true, password });
  },

  register: async (name: string, username: string, password: string) => {
    api.setBaseURL(get().serverHost);
    const response = await api.register(name, username, password);
    
    if (response.Status !== "Positive") {
      throw new Error(response.Message || "Registration failed");
    }
    
    const user: User = {
      username: response.user.username,
      name: response.user.name,
      publicKey: response.user.public_key,
      privateKey: response.user.private_key,
      serverHost: get().serverHost,
    };
    
    await saveUser(user);
    await setCurrentUser(user.username);
    // Save password to sessionStorage for persistence during session
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth_password", password);
    }
    set({ user, isAuthenticated: true, password });
  },

  logout: async () => {
    await clearCurrentUser();
    // Clear password from sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_password");
    }
    set({ user: null, isAuthenticated: false, password: "" });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      if (user) {
        // Try to restore password from sessionStorage
        const savedPassword = typeof window !== "undefined" 
          ? sessionStorage.getItem("auth_password") 
          : null;
        set({ user, isAuthenticated: true, password: savedPassword || "" });
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
