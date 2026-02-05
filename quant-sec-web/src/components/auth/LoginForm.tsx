"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function LoginForm({ onSwitchToRegister, showToast }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
      showToast("Welcome back!", "success");
      router.push("/inbox");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Login failed",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Sign in</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Username
          </label>
          <input
            type="text"
            placeholder="Enter your username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="input-light"
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input-light"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary justify-center py-2.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Don't have an account?{" "}
        <button
          onClick={onSwitchToRegister}
          className="text-gray-900 hover:underline font-medium"
        >
          Create account
        </button>
      </p>
    </motion.div>
  );
}
