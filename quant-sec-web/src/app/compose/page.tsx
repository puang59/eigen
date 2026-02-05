"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, Shield, User, FileText, Lock } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Toast, { useToast } from "@/components/ui/Toast";
import EncryptionFlow from "@/components/crypto/EncryptionFlow";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

interface EncryptionStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
}

const initialSteps: EncryptionStep[] = [
  {
    id: "fetch-key",
    name: "Fetch Recipient's Public Key",
    description: "Retrieve Kyber512 public key from server",
    status: "pending",
  },
  {
    id: "kyber-encap",
    name: "Kyber Encapsulation",
    description: "Generate shared secret using Kyber512 KEM",
    status: "pending",
  },
  {
    id: "aes-encrypt",
    name: "AES Encryption",
    description: "Encrypt message with AES using shared secret",
    status: "pending",
  },
  {
    id: "send-email",
    name: "Send Encrypted Email",
    description: "Transmit ciphertext to server",
    status: "pending",
  },
];

export default function ComposePage() {
  const router = useRouter();
  const { user, password, isAuthenticated, isLoading, initialize, serverHost } =
    useAuthStore();
  const { toast, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState({
    recipient: "",
    subject: "",
    body: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [steps, setSteps] = useState<EncryptionStep[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState(-1);
  const [recipientName, setRecipientName] = useState<string | null>(null);

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
  }, [serverHost]);

  const updateStep = (
    stepId: string,
    status: "pending" | "in_progress" | "completed"
  ) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const resetSteps = () => {
    setSteps(initialSteps);
    setCurrentStep(-1);
  };

  const validateRecipient = async () => {
    if (!formData.recipient.trim()) return;

    try {
      const result = await api.getPublicKey(formData.recipient);
      setRecipientName(result.name);
    } catch {
      setRecipientName(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !password) {
      showToast("Please log in again", "error");
      return;
    }

    if (!formData.recipient || !formData.subject || !formData.body) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setIsSending(true);
    resetSteps();

    try {
      // Step 1: Fetch recipient's public key
      setCurrentStep(0);
      updateStep("fetch-key", "in_progress");
      await new Promise((r) => setTimeout(r, 500)); // Visual delay

      let recipientPublicKey: string;
      try {
        const result = await api.getPublicKey(formData.recipient);
        recipientPublicKey = result.publicKey;
        updateStep("fetch-key", "completed");
      } catch {
        showToast("Recipient not found", "error");
        resetSteps();
        setIsSending(false);
        return;
      }

      // Step 2: Kyber encapsulation + AES encrypt subject
      setCurrentStep(1);
      updateStep("kyber-encap", "in_progress");
      await new Promise((r) => setTimeout(r, 500));

      const encryptedSubject = await api.encrypt(
        formData.subject,
        recipientPublicKey
      );
      if (encryptedSubject.Status !== "Positive") {
        throw new Error("Subject encryption failed");
      }
      updateStep("kyber-encap", "completed");

      // Step 3: AES encrypt body
      setCurrentStep(2);
      updateStep("aes-encrypt", "in_progress");
      await new Promise((r) => setTimeout(r, 500));

      const encryptedBody = await api.encrypt(formData.body, recipientPublicKey);
      if (encryptedBody.Status !== "Positive") {
        throw new Error("Body encryption failed");
      }
      updateStep("aes-encrypt", "completed");

      // Step 4: Send email
      setCurrentStep(3);
      updateStep("send-email", "in_progress");
      await new Promise((r) => setTimeout(r, 500));

      // Package encrypted data
      const subjectPackage = JSON.stringify({
        tag: encryptedSubject.tag,
        data: encryptedSubject.encrypted_data,
      });
      const bodyPackage = JSON.stringify({
        tag: encryptedBody.tag,
        data: encryptedBody.encrypted_data,
      });

      const sendResult = await api.sendEmail(
        user.username,
        password,
        formData.recipient,
        subjectPackage,
        bodyPackage
      );

      if (sendResult.Status !== "Positive") {
        throw new Error(sendResult.Message);
      }

      updateStep("send-email", "completed");
      setCurrentStep(4);

      showToast("Email sent successfully with quantum encryption!", "success");
      
      // Reset form after success
      setTimeout(() => {
        setFormData({ recipient: "", subject: "", body: "" });
        setRecipientName(null);
        resetSteps();
      }, 2000);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to send email",
        "error"
      );
      resetSteps();
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || !user) {
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
          <h1 className="text-3xl font-bold text-white mb-2">Compose Email</h1>
          <p className="text-gray-400">
            Send quantum-encrypted messages securely
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Compose form */}
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-300">
                    Recipient
                  </label>
                </div>
                <Input
                  type="text"
                  placeholder="Enter recipient username"
                  value={formData.recipient}
                  onChange={(e) =>
                    setFormData({ ...formData, recipient: e.target.value })
                  }
                  onBlur={validateRecipient}
                  required
                />
                {recipientName && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-sm text-green-400"
                  >
                    Sending to: {recipientName}
                  </motion.p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-300">
                    Subject
                  </label>
                </div>
                <Input
                  type="text"
                  placeholder="Email subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-300">
                    Message (will be encrypted)
                  </label>
                </div>
                <textarea
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={8}
                  placeholder="Type your message here..."
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isSending}
                disabled={isSending}
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? "Encrypting & Sending..." : "Send Encrypted Email"}
              </Button>
            </form>
          </Card>

          {/* Encryption visualization */}
          <div className="space-y-6">
            <EncryptionFlow steps={steps} currentStep={currentStep} />

            {/* Info card */}
            <Card>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-indigo-600/20 rounded-lg">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    Hybrid Encryption
                  </h3>
                  <p className="text-sm text-gray-400">
                    Your message is encrypted using Kyber512 (post-quantum KEM)
                    to generate a shared secret, which is then used with AES-256
                    for symmetric encryption. This provides security against
                    both classical and quantum attacks.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
