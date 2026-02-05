"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Lock, Key, Shield, FileText } from "lucide-react";

interface Step {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
}

interface EncryptionFlowProps {
  steps: Step[];
  currentStep: number;
}

export default function EncryptionFlow({ steps, currentStep }: EncryptionFlowProps) {
  const icons = {
    "fetch-key": Key,
    "kyber-encap": Shield,
    "aes-encrypt": Lock,
    "send-email": FileText,
    "fetch-emails": FileText,
    "kyber-decap": Shield,
    "aes-decrypt": Lock,
    "verify-tag": Check,
  };

  return (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">Encryption Flow</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = icons[step.id as keyof typeof icons] || Lock;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-start gap-4 p-3 rounded-lg transition-all
                ${step.status === "in_progress" ? "bg-indigo-900/30 border border-indigo-500/30" : ""}
                ${step.status === "completed" ? "bg-green-900/20" : ""}
              `}
            >
              {/* Status indicator */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${step.status === "pending" ? "bg-gray-800 text-gray-500" : ""}
                  ${step.status === "in_progress" ? "bg-indigo-600 text-white" : ""}
                  ${step.status === "completed" ? "bg-green-600 text-white" : ""}
                `}
              >
                {step.status === "in_progress" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                ) : step.status === "completed" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Step info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`
                      font-medium
                      ${step.status === "pending" ? "text-gray-500" : ""}
                      ${step.status === "in_progress" ? "text-indigo-300" : ""}
                      ${step.status === "completed" ? "text-green-300" : ""}
                    `}
                  >
                    {step.name}
                  </span>
                  {step.status === "in_progress" && (
                    <span className="text-xs text-indigo-400 animate-pulse">
                      Processing...
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>

              {/* Step number */}
              <div className="text-sm text-gray-600 font-mono">
                {String(index + 1).padStart(2, "0")}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6 h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
