"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";
import Toast, { useToast } from "@/components/ui/Toast";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuthStore } from "@/store/auth";

export default function HomePage() {
  const router = useRouter();
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/inbox");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Mail className="w-8 h-8 text-gray-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm mx-4"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 bg-black rounded-lg">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">Eigen</span>
        </div>

        {/* Auth form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <AnimatePresence mode="wait">
            {authMode === "login" ? (
              <LoginForm
                key="login"
                onSwitchToRegister={() => setAuthMode("register")}
                showToast={showToast}
              />
            ) : (
              <RegisterForm
                key="register"
                onSwitchToLogin={() => setAuthMode("login")}
                showToast={showToast}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
