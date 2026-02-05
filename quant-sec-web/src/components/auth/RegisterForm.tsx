"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Settings } from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function RegisterForm({ onSwitchToLogin, showToast }: RegisterFormProps) {
  const router = useRouter();
  const { register, serverHost, setServerHost } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.name, formData.username, formData.password);
      showToast("Account created!", "success");
      router.push("/inbox");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Registration failed",
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
        <h2 className="text-xl font-semibold text-gray-900">Create account</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-light"
            required
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Username
          </label>
          <input
            type="text"
            placeholder="Choose a username"
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
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input-light"
            required
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="input-light"
            required
            autoComplete="new-password"
          />
        </div>

        {/* Server config toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowServerConfig(!showServerConfig)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            Server settings
          </button>
          
          {showServerConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2"
            >
              <input
                type="text"
                placeholder="Server URL"
                value={serverHost}
                onChange={(e) => setServerHost(e.target.value)}
                className="input-light text-sm"
              />
            </motion.div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary justify-center py-2.5 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          className="text-gray-900 hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </motion.div>
  );
}
