"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, Server } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function LoginForm({ onSwitchToRegister, showToast }: LoginFormProps) {
  const router = useRouter();
  const { login, serverHost, setServerHost } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showServerInput, setShowServerInput] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    serverHost: serverHost,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Set server host
      api.setBaseURL(formData.serverHost);
      setServerHost(formData.serverHost);

      const response = await api.login(formData.username, formData.password);

      if (response.Status === "Positive") {
        await login(
          {
            username: response.user.username,
            name: response.user.name,
            publicKey: response.user.public_key,
            privateKey: response.user.private_key,
            serverHost: formData.serverHost,
          },
          formData.password
        );
        showToast("Login successful!", "success");
        router.push("/dashboard");
      } else {
        showToast(response.Message, "error");
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to login",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-gray-400">Sign in to your quantum-secure account</p>
      </div>

      <Input
        label="Username"
        type="text"
        placeholder="Enter your username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />

      <div>
        <button
          type="button"
          onClick={() => setShowServerInput(!showServerInput)}
          className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <Server className="w-4 h-4" />
          {showServerInput ? "Hide" : "Change"} server
        </button>
        
        {showServerInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2"
          >
            <Input
              placeholder="http://localhost:8000"
              value={formData.serverHost}
              onChange={(e) =>
                setFormData({ ...formData, serverHost: e.target.value })
              }
            />
          </motion.div>
        )}
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </Button>

      <p className="text-center text-gray-400">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-indigo-400 hover:text-indigo-300 font-medium"
        >
          Create one
        </button>
      </p>
    </motion.form>
  );
}
