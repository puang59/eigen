"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Inbox,
  RefreshCw,
  Trash2,
  Mail,
  Clock,
  Lock,
  Unlock,
  ChevronRight,
  X,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast, { useToast } from "@/components/ui/Toast";
import EncryptionFlow from "@/components/crypto/EncryptionFlow";
import { useAuthStore } from "@/store/auth";
import { saveEmails, getEmails, clearEmails } from "@/lib/db";
import api from "@/lib/api";
import { Email } from "@/lib/types";

interface DecryptionStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
}

const decryptionSteps: DecryptionStep[] = [
  {
    id: "verify-tag",
    name: "Verify Integrity Tag",
    description: "Check SHA-256 hash for tampering",
    status: "pending",
  },
  {
    id: "kyber-decap",
    name: "Kyber Decapsulation",
    description: "Recover shared secret using private key",
    status: "pending",
  },
  {
    id: "aes-decrypt",
    name: "AES Decryption",
    description: "Decrypt message using shared secret",
    status: "pending",
  },
];

export default function InboxPage() {
  const router = useRouter();
  const { user, password, isAuthenticated, isLoading, initialize, serverHost } =
    useAuthStore();
  const { toast, showToast, hideToast } = useToast();

  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [steps, setSteps] = useState<DecryptionStep[]>(decryptionSteps);
  const [currentStep, setCurrentStep] = useState(-1);

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
    loadLocalEmails();
  }, [serverHost]);

  const loadLocalEmails = async () => {
    const localEmails = await getEmails();
    setEmails(localEmails);
  };

  const updateStep = (
    stepId: string,
    status: "pending" | "in_progress" | "completed"
  ) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const resetSteps = () => {
    setSteps(
      decryptionSteps.map((s) => ({ ...s, status: "pending" as const }))
    );
    setCurrentStep(-1);
  };

  const syncInbox = async () => {
    if (!user || !password) {
      showToast("Please log in again", "error");
      return;
    }

    setIsSyncing(true);
    try {
      const response = await api.getInbox(user.username, password);

      if (response.Status !== "Positive") {
        throw new Error(response.Message);
      }

      if (response.Emails && response.Emails.length > 0) {
        const newEmails: Omit<Email, "id">[] = response.Emails.map((email) => ({
          sender: email.sender,
          subject: email.encrypted_subject,
          body: email.encrypted_body,
          timestamp: email.datetime_of_arrival,
          encrypted: true,
        }));

        await saveEmails(newEmails);
        await loadLocalEmails();
        showToast(`Synced ${newEmails.length} new email(s)`, "success");
      } else {
        showToast("No new emails", "info");
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to sync inbox",
        "error"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearInbox = async () => {
    if (!user || !password) return;

    if (!confirm("Are you sure you want to clear your inbox?")) return;

    try {
      await api.clearInbox(user.username, password);
      await clearEmails();
      setEmails([]);
      setSelectedEmail(null);
      showToast("Inbox cleared", "success");
    } catch (error) {
      showToast("Failed to clear inbox", "error");
    }
  };

  const decryptEmail = async (email: Email) => {
    if (!user) return;

    setSelectedEmail(email);
    setDecryptedContent(null);
    resetSteps();
    setIsDecrypting(true);

    try {
      // Parse encrypted packages
      const subjectPkg = JSON.parse(email.subject);
      const bodyPkg = JSON.parse(email.body);

      // Step 1: Verify tag
      setCurrentStep(0);
      updateStep("verify-tag", "in_progress");
      await new Promise((r) => setTimeout(r, 400));
      updateStep("verify-tag", "completed");

      // Step 2: Kyber decapsulation
      setCurrentStep(1);
      updateStep("kyber-decap", "in_progress");
      await new Promise((r) => setTimeout(r, 600));

      // Decrypt subject
      const decryptedSubjectRes = await api.decrypt(
        subjectPkg.tag,
        subjectPkg.data,
        user.privateKey
      );

      if (decryptedSubjectRes.Status !== "Positive") {
        throw new Error("Failed to decrypt subject");
      }
      updateStep("kyber-decap", "completed");

      // Step 3: AES decrypt body
      setCurrentStep(2);
      updateStep("aes-decrypt", "in_progress");
      await new Promise((r) => setTimeout(r, 400));

      const decryptedBodyRes = await api.decrypt(
        bodyPkg.tag,
        bodyPkg.data,
        user.privateKey
      );

      if (decryptedBodyRes.Status !== "Positive") {
        throw new Error("Failed to decrypt body");
      }
      updateStep("aes-decrypt", "completed");

      setDecryptedContent({
        subject: decryptedSubjectRes.decrypted_message,
        body: decryptedBodyRes.decrypted_message,
      });

      setCurrentStep(3);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Decryption failed",
        "error"
      );
      resetSteps();
    } finally {
      setIsDecrypting(false);
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
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">Inbox</h1>
            <p className="text-gray-400">
              Your encrypted messages ({emails.length} emails)
            </p>
          </motion.div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={syncInbox}
              isLoading={isSyncing}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync
            </Button>
            <Button
              variant="danger"
              onClick={handleClearInbox}
              disabled={emails.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email list */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Inbox className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Messages</h2>
            </div>

            {emails.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {emails.map((email, index) => (
                  <motion.button
                    key={email.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => decryptEmail(email)}
                    className={`
                      w-full text-left p-4 rounded-lg transition-all
                      ${
                        selectedEmail?.id === email.id
                          ? "bg-indigo-600/20 border border-indigo-500/30"
                          : "bg-gray-900/50 hover:bg-gray-800/50 border border-transparent"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded ${
                            email.encrypted
                              ? "bg-yellow-600/20"
                              : "bg-green-600/20"
                          }`}
                        >
                          {email.encrypted ? (
                            <Lock className="w-3 h-3 text-yellow-400" />
                          ) : (
                            <Unlock className="w-3 h-3 text-green-400" />
                          )}
                        </div>
                        <span className="font-medium text-gray-200">
                          {email.sender}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-500 truncate mb-1">
                      {email.encrypted ? "[Encrypted]" : email.subject}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      {new Date(email.timestamp).toLocaleString()}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No emails yet</p>
                <p className="text-sm">Click Sync to check for new messages</p>
              </div>
            )}
          </Card>

          {/* Email viewer / Decryption */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {selectedEmail ? (
                <motion.div
                  key="email-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        {decryptedContent
                          ? "Decrypted Email"
                          : "Decrypting..."}
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedEmail(null);
                          setDecryptedContent(null);
                          resetSteps();
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    {decryptedContent ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400">From</label>
                          <p className="text-gray-200">{selectedEmail.sender}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">
                            Subject
                          </label>
                          <p className="text-white font-medium">
                            {decryptedContent.subject}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">
                            Message
                          </label>
                          <div className="bg-gray-900/50 rounded-lg p-4 mt-1">
                            <p className="text-gray-200 whitespace-pre-wrap">
                              {decryptedContent.body}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <Shield className="w-4 h-4" />
                          <span>Successfully decrypted with Kyber512</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="inline-block mb-4"
                        >
                          <Lock className="w-8 h-8 text-indigo-400" />
                        </motion.div>
                        <p>Decrypting message...</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="no-selection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <div className="text-center py-12 text-gray-500">
                      <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select an email to decrypt and view</p>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Decryption flow */}
            {selectedEmail && (
              <EncryptionFlow steps={steps} currentStep={currentStep} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
