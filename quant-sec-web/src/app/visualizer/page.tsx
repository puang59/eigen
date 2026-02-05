"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Play, RotateCcw, Key, Lock, Unlock } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast, { useToast } from "@/components/ui/Toast";
import KyberVisualizer from "@/components/crypto/KyberVisualizer";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { KyberParams } from "@/lib/types";

type DemoStep = "idle" | "keygen" | "encap" | "decap" | "complete";

export default function VisualizerPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize, serverHost } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();

  const [kyberParams, setKyberParams] = useState<KyberParams | null>(null);
  const [demoStep, setDemoStep] = useState<DemoStep>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [demoData, setDemoData] = useState<{
    publicKey?: string;
    privateKey?: string;
    ciphertext?: string;
    sharedKey?: string;
    message?: string;
    decryptedMessage?: string;
  }>({});

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    api.setBaseURL(serverHost);
    loadKyberParams();
  }, [serverHost]);

  const loadKyberParams = async () => {
    try {
      const params = await api.getKyberParams();
      setKyberParams(params);
    } catch (error) {
      showToast("Failed to load Kyber parameters", "error");
    }
  };

  const runDemo = async () => {
    setIsRunning(true);
    setDemoData({});

    try {
      // Step 1: Key Generation
      setDemoStep("keygen");
      showToast("Generating Kyber512 keypair...", "info");
      await new Promise((r) => setTimeout(r, 1500));

      const keygenResult = await api.generateKeypair();
      if (keygenResult.Status !== "Positive") {
        throw new Error("Key generation failed");
      }

      setDemoData({
        publicKey: keygenResult.public_key.substring(0, 64) + "...",
        privateKey: keygenResult.private_key.substring(0, 64) + "...",
      });
      showToast("Keypair generated!", "success");

      await new Promise((r) => setTimeout(r, 1000));

      // Step 2: Encapsulation
      setDemoStep("encap");
      showToast("Performing Kyber encapsulation...", "info");
      await new Promise((r) => setTimeout(r, 1500));

      const testMessage = "Hello, Quantum World! 🔐";
      const encryptResult = await api.encrypt(testMessage, keygenResult.public_key);

      if (encryptResult.Status !== "Positive") {
        throw new Error("Encryption failed");
      }

      setDemoData((prev) => ({
        ...prev,
        message: testMessage,
        ciphertext: encryptResult.encrypted_data.substring(0, 64) + "...",
        sharedKey: encryptResult.visualization.shared_key_preview,
      }));
      showToast("Message encrypted with hybrid encryption!", "success");

      await new Promise((r) => setTimeout(r, 1000));

      // Step 3: Decapsulation
      setDemoStep("decap");
      showToast("Performing Kyber decapsulation...", "info");
      await new Promise((r) => setTimeout(r, 1500));

      const decryptResult = await api.decrypt(
        encryptResult.tag,
        encryptResult.encrypted_data,
        keygenResult.private_key
      );

      if (decryptResult.Status !== "Positive") {
        throw new Error("Decryption failed");
      }

      setDemoData((prev) => ({
        ...prev,
        decryptedMessage: decryptResult.decrypted_message,
      }));
      showToast("Message decrypted successfully!", "success");

      setDemoStep("complete");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Demo failed",
        "error"
      );
      setDemoStep("idle");
    } finally {
      setIsRunning(false);
    }
  };

  const resetDemo = () => {
    setDemoStep("idle");
    setDemoData({});
  };

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
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Kyber512 Visualizer
          </h1>
          <p className="text-gray-400">
            Explore how post-quantum encryption works step by step
          </p>
        </motion.div>

        {/* Demo controls */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Interactive Demo
              </h2>
              <p className="text-gray-400 text-sm">
                Watch a complete Kyber512 encryption/decryption cycle in action
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={runDemo}
                disabled={isRunning}
                isLoading={isRunning}
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? "Running..." : "Run Demo"}
              </Button>
              <Button
                variant="secondary"
                onClick={resetDemo}
                disabled={isRunning}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Demo progress */}
          {demoStep !== "idle" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 pt-6 border-t border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <DemoStepCard
                  icon={<Key className="w-5 h-5" />}
                  title="Key Generation"
                  isActive={demoStep === "keygen"}
                  isComplete={
                    ["encap", "decap", "complete"].includes(demoStep)
                  }
                  data={
                    demoData.publicKey
                      ? [
                          { label: "Public Key", value: demoData.publicKey },
                          { label: "Private Key", value: demoData.privateKey },
                        ]
                      : undefined
                  }
                />
                <DemoStepCard
                  icon={<Lock className="w-5 h-5" />}
                  title="Encapsulation"
                  isActive={demoStep === "encap"}
                  isComplete={["decap", "complete"].includes(demoStep)}
                  data={
                    demoData.ciphertext
                      ? [
                          { label: "Message", value: demoData.message },
                          { label: "Ciphertext", value: demoData.ciphertext },
                          { label: "Shared Key", value: demoData.sharedKey },
                        ]
                      : undefined
                  }
                />
                <DemoStepCard
                  icon={<Unlock className="w-5 h-5" />}
                  title="Decapsulation"
                  isActive={demoStep === "decap"}
                  isComplete={demoStep === "complete"}
                  data={
                    demoData.decryptedMessage
                      ? [
                          {
                            label: "Decrypted",
                            value: demoData.decryptedMessage,
                          },
                        ]
                      : undefined
                  }
                />
                <DemoStepCard
                  icon={<Shield className="w-5 h-5" />}
                  title="Verification"
                  isActive={false}
                  isComplete={demoStep === "complete"}
                  data={
                    demoStep === "complete"
                      ? [
                          {
                            label: "Status",
                            value:
                              demoData.message === demoData.decryptedMessage
                                ? "✓ Messages match!"
                                : "✗ Mismatch",
                          },
                        ]
                      : undefined
                  }
                />
              </div>
            </motion.div>
          )}
        </Card>

        {/* Kyber visualizer */}
        <KyberVisualizer
          params={kyberParams}
          activeStep={
            demoStep === "keygen"
              ? "keygen"
              : demoStep === "encap"
              ? "encap"
              : demoStep === "decap"
              ? "decap"
              : null
          }
        />

        {/* Security info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-600/20 rounded-xl">
                <Shield className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Why Kyber512?
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {kyberParams?.description}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-gray-300">
                      {kyberParams?.security_level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-gray-300">NIST Standardized</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="text-gray-300">
                      Quantum-Resistant
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

function DemoStepCard({
  icon,
  title,
  isActive,
  isComplete,
  data,
}: {
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  isComplete: boolean;
  data?: Array<{ label: string; value?: string }>;
}) {
  return (
    <motion.div
      animate={isActive ? { scale: 1.02 } : { scale: 1 }}
      className={`
        p-4 rounded-xl border transition-all
        ${
          isActive
            ? "bg-indigo-900/30 border-indigo-500"
            : isComplete
            ? "bg-green-900/20 border-green-700/50"
            : "bg-gray-800/30 border-gray-700/50"
        }
      `}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`
            p-2 rounded-lg
            ${
              isActive
                ? "bg-indigo-600 text-white"
                : isComplete
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-400"
            }
          `}
        >
          {isActive ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              {icon}
            </motion.div>
          ) : (
            icon
          )}
        </div>
        <span
          className={`font-medium ${
            isActive
              ? "text-indigo-300"
              : isComplete
              ? "text-green-300"
              : "text-gray-500"
          }`}
        >
          {title}
        </span>
      </div>

      {data && (
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={i}>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-xs text-gray-300 font-mono truncate">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {isActive && !data && (
        <div className="h-12 flex items-center justify-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
                className="w-2 h-2 rounded-full bg-indigo-400"
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
