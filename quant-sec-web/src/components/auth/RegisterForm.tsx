"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Server, Key, Shield } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function RegisterForm({
  onSwitchToLogin,
  showToast,
}: RegisterFormProps) {
  const router = useRouter();
  const { login, serverHost, setServerHost } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showServerInput, setShowServerInput] = useState(false);
  const [step, setStep] = useState<"form" | "generating">("form");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    serverHost: serverHost,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setStep("generating");

    try {
      // Set server host
      api.setBaseURL(formData.serverHost);
      setServerHost(formData.serverHost);

      // Check username availability
      const isAvailable = await api.checkUsername(formData.username);
      if (!isAvailable) {
        showToast("Username is already taken", "error");
        setStep("form");
        setIsLoading(false);
        return;
      }

      // Register user (server generates Kyber keypair)
      const response = await api.register(
        formData.name,
        formData.username,
        formData.password
      );

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
        showToast("Account created successfully!", "success");
        router.push("/dashboard");
      } else {
        showToast(response.Message, "error");
        setStep("form");
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to register",
        "error"
      );
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "generating") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block mb-6"
        >
          <Key className="w-16 h-16 text-indigo-400" />
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Generating Kyber512 Keypair
        </h3>
        <p className="text-gray-400 mb-4">
          Creating your post-quantum secure encryption keys...
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Shield className="w-4 h-4" />
          <span>NIST Level 1 Security</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
        <p className="text-gray-400">Join the quantum-secure network</p>
      </div>

      <Input
        label="Full Name"
        type="text"
        placeholder="Enter your name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
      />

      <Input
        label="Username"
        type="text"
        placeholder="Choose a username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        error={errors.username}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="Create a password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        required
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChange={(e) =>
          setFormData({ ...formData, confirmPassword: e.target.value })
        }
        error={errors.confirmPassword}
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
        <UserPlus className="w-4 h-4 mr-2" />
        Create Account
      </Button>

      <p className="text-center text-gray-400">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-indigo-400 hover:text-indigo-300 font-medium"
        >
          Sign in
        </button>
      </p>
    </motion.form>
  );
}
