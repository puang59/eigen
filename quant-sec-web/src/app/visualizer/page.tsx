"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Play, RotateCcw, Key, Lock, Unlock, ArrowLeft, Mail, Loader2, Check } from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import Toast, { useToast } from "@/components/ui/Toast";
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
    } catch {
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

      const testMessage = "Hello, Quantum World!";
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
    <div className="h-screen flex bg-gray-50">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <button
            onClick={() => router.push("/inbox")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Kyber512 Visualizer</h1>
            <p className="text-sm text-gray-500">Explore post-quantum encryption</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Demo controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Interactive Demo
                </h2>
                <p className="text-sm text-gray-500">
                  Watch a complete Kyber512 encryption/decryption cycle
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={runDemo}
                  disabled={isRunning}
                  className="btn-primary"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Demo
                    </>
                  )}
                </button>
                <button
                  onClick={resetDemo}
                  disabled={isRunning}
                  className="btn-outline"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>

            {/* Demo progress */}
            {demoStep !== "idle" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pt-6 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <DemoStepCard
                    icon={<Key className="w-5 h-5" />}
                    title="Key Generation"
                    isActive={demoStep === "keygen"}
                    isComplete={["encap", "decap", "complete"].includes(demoStep)}
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
                        ? [{ label: "Decrypted", value: demoData.decryptedMessage }]
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
                                  ? "Messages match!"
                                  : "Mismatch",
                            },
                          ]
                        : undefined
                    }
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Security info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Why Kyber512?
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {kyberParams?.description || "Kyber is a post-quantum key encapsulation mechanism based on the hardness of solving the learning-with-errors (LWE) problem over module lattices."}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-gray-600">
                      {kyberParams?.security_level || "128-bit security"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-gray-600">NIST Standardized</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="text-gray-600">Quantum-Resistant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
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
            ? "bg-blue-50 border-blue-200"
            : isComplete
            ? "bg-green-50 border-green-200"
            : "bg-gray-50 border-gray-200"
        }
      `}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`
            p-2 rounded-lg
            ${
              isActive
                ? "bg-blue-500 text-white"
                : isComplete
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-500"
            }
          `}
        >
          {isActive ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isComplete ? (
            <Check className="w-5 h-5" />
          ) : (
            icon
          )}
        </div>
        <span
          className={`font-medium ${
            isActive
              ? "text-blue-700"
              : isComplete
              ? "text-green-700"
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
              <p className="text-xs text-gray-700 font-mono truncate">
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
                className="w-2 h-2 rounded-full bg-blue-400"
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
