"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Zap } from "lucide-react";
import Card from "@/components/ui/Card";
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
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Shield className="w-12 h-12 text-indigo-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg grid-pattern">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <div className="container mx-auto px-4 py-12 min-h-screen flex flex-col lg:flex-row items-center justify-center gap-12">
        {/* Left side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 max-w-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-600/20 rounded-xl">
              <Shield className="w-10 h-10 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">QuantumMail</h1>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Post-Quantum Secure
            <span className="gradient-text block">Email Communication</span>
          </h2>

          <p className="text-gray-400 text-lg mb-8">
            Protect your communications from future quantum computer attacks with
            Kyber512 encryption - the NIST-approved post-quantum cryptographic
            standard.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-indigo-400" />}
              title="Kyber512"
              description="Post-quantum KEM"
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6 text-purple-400" />}
              title="AES-256"
              description="Hybrid encryption"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-yellow-400" />}
              title="End-to-End"
              description="Full security"
            />
          </div>
        </motion.div>

        {/* Right side - Auth form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="glow">
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
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 text-center"
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <h3 className="font-semibold text-white text-sm">{title}</h3>
      <p className="text-gray-500 text-xs">{description}</p>
    </motion.div>
  );
}
