"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Search,
  Settings,
  LogOut,
  RefreshCw,
  Star,
  Archive,
  Trash2,
  Reply,
  ReplyAll,
  Forward,
  MoreVertical,
  X,
  Send,
  Paperclip,
  Type,
  Shield,
  Lock,
  Check,
  Loader2,
} from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import Toast, { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/auth";
import { saveEmails, getEmailsByFolder, clearEmails, saveEmail } from "@/lib/db";
import api from "@/lib/api";
import { Email } from "@/lib/types";

interface DecryptionStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
}

const decryptionSteps: DecryptionStep[] = [
  { id: "verify-tag", name: "Verify Integrity Tag", description: "Check SHA-256 hash", status: "pending" },
  { id: "kyber-decap", name: "Kyber Decapsulation", description: "Recover shared secret", status: "pending" },
  { id: "aes-decrypt", name: "AES Decryption", description: "Decrypt message content", status: "pending" },
];

interface EncryptionStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
}

const encryptionSteps: EncryptionStep[] = [
  { id: "fetch-key", name: "Fetch Public Key", description: "Get recipient's Kyber key", status: "pending" },
  { id: "kyber-encap", name: "Kyber Encapsulation", description: "Generate shared secret", status: "pending" },
  { id: "aes-encrypt", name: "AES Encryption", description: "Encrypt message", status: "pending" },
  { id: "send-email", name: "Send Email", description: "Transmit ciphertext", status: "pending" },
];

export default function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, password, isAuthenticated, isLoading, initialize, logout, serverHost } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();

  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<{ subject: string; body: string } | null>(null);
  const [steps, setSteps] = useState<DecryptionStep[]>(decryptionSteps);
  const [currentStep, setCurrentStep] = useState(-1);
  const [showDecryptionFlow, setShowDecryptionFlow] = useState(false);

  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ recipient: "", subject: "", body: "" });
  const [isSending, setIsSending] = useState(false);
  const [sendSteps, setSendSteps] = useState<EncryptionStep[]>(encryptionSteps);
  const [sendCurrentStep, setSendCurrentStep] = useState(-1);
  const [recipientName, setRecipientName] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Get current folder from URL
  const currentFolder = searchParams.get("folder") as "inbox" | "sent" | null;
  const folder = currentFolder === "sent" ? "sent" : "inbox";

  useEffect(() => {
    api.setBaseURL(serverHost);
    loadLocalEmails();
  }, [serverHost, folder]);

  // Handle compose query param
  useEffect(() => {
    if (searchParams.get("compose") === "true") {
      setShowCompose(true);
      // Clean up URL
      router.replace("/inbox");
    }
  }, [searchParams, router]);

  const loadLocalEmails = async () => {
    const localEmails = await getEmailsByFolder(folder);
    setEmails(localEmails);
  };

  const updateStep = (stepId: string, status: "pending" | "in_progress" | "completed") => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status } : step)));
  };

  const resetSteps = () => {
    setSteps(decryptionSteps.map((s) => ({ ...s, status: "pending" as const })));
    setCurrentStep(-1);
  };

  const updateSendStep = (stepId: string, status: "pending" | "in_progress" | "completed") => {
    setSendSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status } : step)));
  };

  const resetSendSteps = () => {
    setSendSteps(encryptionSteps.map((s) => ({ ...s, status: "pending" as const })));
    setSendCurrentStep(-1);
  };

  const syncInbox = async () => {
    if (!user || !password) {
      showToast("Please log in again", "error");
      return;
    }

    setIsSyncing(true);
    try {
      const response = await api.getInbox(user.username, password);
      if (response.Status !== "Positive") throw new Error(response.Message);

      if (response.Emails && response.Emails.length > 0) {
        const newEmails: Omit<Email, "id">[] = response.Emails.map((email) => ({
          sender: email.sender,
          subject: email.encrypted_subject,
          body: email.encrypted_body,
          timestamp: email.datetime_of_arrival,
          encrypted: true,
          folder: "inbox" as const,
        }));
        await saveEmails(newEmails);
        await loadLocalEmails();
        showToast(`Synced ${newEmails.length} new email(s)`, "success");
      } else {
        showToast("No new emails", "info");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to sync inbox", "error");
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
    } catch {
      showToast("Failed to clear inbox", "error");
    }
  };

  const decryptEmail = async (email: Email) => {
    if (!user) return;

    setSelectedEmail(email);
    setDecryptedContent(null);
    resetSteps();
    setIsDecrypting(true);
    setShowDecryptionFlow(true);

    try {
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

      const decryptedSubjectRes = await api.decrypt(subjectPkg.tag, subjectPkg.data, user.privateKey);
      if (decryptedSubjectRes.Status !== "Positive") throw new Error("Failed to decrypt subject");
      updateStep("kyber-decap", "completed");

      // Step 3: AES decrypt body
      setCurrentStep(2);
      updateStep("aes-decrypt", "in_progress");
      await new Promise((r) => setTimeout(r, 400));

      const decryptedBodyRes = await api.decrypt(bodyPkg.tag, bodyPkg.data, user.privateKey);
      if (decryptedBodyRes.Status !== "Positive") throw new Error("Failed to decrypt body");
      updateStep("aes-decrypt", "completed");

      setDecryptedContent({ subject: decryptedSubjectRes.decrypted_message, body: decryptedBodyRes.decrypted_message });
      setCurrentStep(3);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Decryption failed", "error");
      resetSteps();
    } finally {
      setIsDecrypting(false);
    }
  };

  const validateRecipient = async () => {
    if (!composeData.recipient.trim()) return;
    try {
      const result = await api.getPublicKey(composeData.recipient);
      setRecipientName(result.name);
    } catch {
      setRecipientName(null);
    }
  };

  const handleSendEmail = async () => {
    if (!user || !password) {
      showToast("Please log in again", "error");
      return;
    }
    if (!composeData.recipient || !composeData.subject || !composeData.body) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setIsSending(true);
    resetSendSteps();

    try {
      // Step 1: Fetch recipient's public key
      setSendCurrentStep(0);
      updateSendStep("fetch-key", "in_progress");
      await new Promise((r) => setTimeout(r, 500));

      let recipientPublicKey: string;
      try {
        const result = await api.getPublicKey(composeData.recipient);
        recipientPublicKey = result.publicKey;
        updateSendStep("fetch-key", "completed");
      } catch {
        showToast("Recipient not found", "error");
        resetSendSteps();
        setIsSending(false);
        return;
      }

      // Step 2: Kyber encapsulation
      setSendCurrentStep(1);
      updateSendStep("kyber-encap", "in_progress");
      await new Promise((r) => setTimeout(r, 500));

      const encryptedSubject = await api.encrypt(composeData.subject, recipientPublicKey);
      if (encryptedSubject.Status !== "Positive") throw new Error("Subject encryption failed");
      updateSendStep("kyber-encap", "completed");

      // Step 3: AES encrypt body
      setSendCurrentStep(2);
      updateSendStep("aes-encrypt", "in_progress");
      await new Promise((r) => setTimeout(r, 500));

      const encryptedBody = await api.encrypt(composeData.body, recipientPublicKey);
      if (encryptedBody.Status !== "Positive") throw new Error("Body encryption failed");
      updateSendStep("aes-encrypt", "completed");

      // Step 4: Send email
      setSendCurrentStep(3);
      updateSendStep("send-email", "in_progress");
      await new Promise((r) => setTimeout(r, 500));

      const subjectPackage = JSON.stringify({ tag: encryptedSubject.tag, data: encryptedSubject.encrypted_data });
      const bodyPackage = JSON.stringify({ tag: encryptedBody.tag, data: encryptedBody.encrypted_data });

      const sendResult = await api.sendEmail(user.username, password, composeData.recipient, subjectPackage, bodyPackage);
      if (sendResult.Status !== "Positive") throw new Error(sendResult.Message);

      updateSendStep("send-email", "completed");
      setSendCurrentStep(4);

      // Save to sent folder locally
      await saveEmail({
        sender: user.username,
        receiver: composeData.recipient,
        subject: composeData.subject,
        body: composeData.body,
        timestamp: new Date().toISOString(),
        encrypted: false,
        folder: "sent",
      });

      showToast("Email sent with quantum encryption!", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to send email", "error");
      resetSendSteps();
    } finally {
      setIsSending(false);
    }
  };

  const handleViewSentEmail = (email: Email) => {
    setSelectedEmail(email);
    setDecryptedContent({ subject: email.subject, body: email.body });
    setShowDecryptionFlow(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Mail className="w-8 h-8 text-gray-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />

      {/* Sidebar */}
      <Sidebar onCompose={() => setShowCompose(true)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-gray-700" />
            <span className="text-xl font-semibold text-gray-900">Eigen</span>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search emails..." className="search-input" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={syncInbox} disabled={isSyncing} className="btn-primary">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              Sync
            </button>
            <button className="action-btn">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="action-btn danger">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Email Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{folder === "sent" ? "Sent" : "Inbox"}</h2>
                <span className="text-sm text-gray-500">{emails.length} emails</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {emails.length > 0 ? (
                emails.map((email, index) => (
                  <motion.div
                    key={email.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => folder === "sent" ? handleViewSentEmail(email) : decryptEmail(email)}
                    className={`email-item ${selectedEmail?.id === email.id ? "active" : ""} ${email.encrypted ? "unread" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {email.encrypted && <span className="w-2 h-2 rounded-full bg-gray-900"></span>}
                        <span className="font-medium text-gray-900">{folder === "sent" ? `To: ${email.receiver}` : email.sender}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(email.timestamp).toLocaleDateString()}
                        </span>
                        <button className="star-btn" onClick={(e) => e.stopPropagation()}>
                          <Star className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {email.encrypted ? "[Encrypted]" : email.subject}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {email.encrypted ? "Click to decrypt..." : (email.body?.substring(0, 50) || "")}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Mail className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No emails yet</p>
                  <p className="text-xs">Click Sync to check for messages</p>
                </div>
              )}
            </div>

            {emails.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <button onClick={handleClearInbox} className="btn-outline w-full justify-center text-sm text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                  Clear Inbox
                </button>
              </div>
            )}
          </div>

          {/* Email Content */}
          <div className="flex-1 flex bg-white">
            <AnimatePresence mode="wait">
              {selectedEmail && (decryptedContent || isDecrypting) ? (
                <motion.div
                  key="email-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex"
                >
                  {/* Main Email Content */}
                  <div className="flex-1 flex flex-col">
                    {decryptedContent ? (
                      <>
                        {/* Email Header */}
                        <div className="p-6 border-b border-gray-200">
                          <div className="flex items-start justify-between mb-4">
                            <h1 className="text-xl font-semibold text-gray-900">{decryptedContent.subject}</h1>
                            <button className="action-btn">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">From: {selectedEmail.sender}</span>
                            <span className="text-gray-400">•</span>
                            <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {folder === "sent" ? `To: ${selectedEmail.receiver}` : `To: ${user.username}`}
                          </div>
                        </div>

                        {/* Email Body */}
                        <div className="flex-1 p-6 overflow-y-auto">
                          <div className="prose prose-gray max-w-none">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {decryptedContent.body}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 border-t border-gray-200 flex items-center gap-2">
                          <button className="btn-outline">
                            <Reply className="w-4 h-4" />
                            Reply
                          </button>
                          <button className="btn-outline">
                            <ReplyAll className="w-4 h-4" />
                            Reply All
                          </button>
                          <button className="btn-outline">
                            <Forward className="w-4 h-4" />
                            Forward
                          </button>
                          <div className="flex-1"></div>
                          <button className="action-btn">
                            <Star className="w-5 h-5" />
                          </button>
                          <button className="action-btn">
                            <Archive className="w-5 h-5" />
                          </button>
                          <button className="action-btn danger">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="mb-4"
                        >
                          <Lock className="w-10 h-10 text-blue-500" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-gray-900">Decrypting Email</h3>
                        <p className="text-sm text-gray-500">Using Kyber512 post-quantum decryption</p>
                      </div>
                    )}
                  </div>

                  {/* Decryption Steps Panel - only show for inbox emails */}
                  {folder !== "sent" && (
                    <div className="w-72 border-l border-gray-200 bg-gray-50 flex flex-col">
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-5 h-5 ${steps.every(s => s.status === "completed") ? "text-green-600" : "text-blue-500"}`} />
                          <h3 className="font-semibold text-gray-900">Decryption Steps</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Kyber512 post-quantum</p>
                      </div>
                      <div className="p-4 space-y-3">
                        {steps.map((step, index) => (
                          <div key={step.id} className={`encryption-step ${step.status === "in_progress" ? "active" : ""} ${step.status === "completed" ? "completed" : ""}`}>
                            <div className={`step-indicator ${step.status}`}>
                              {step.status === "in_progress" ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : step.status === "completed" ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium text-sm ${step.status === "pending" ? "text-gray-400" : "text-gray-900"}`}>
                                {step.name}
                              </p>
                              <p className="text-xs text-gray-500">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {steps.every(s => s.status === "completed") && (
                        <div className="mt-auto p-4 bg-green-50 border-t border-green-100">
                          <div className="flex items-center gap-2 text-green-700">
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">Decryption Complete</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="no-selection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-gray-400"
                >
                  <Mail className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg">Select an email to read</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => !isSending && setShowCompose(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Compose Email</h2>
                <button onClick={() => !isSending && setShowCompose(false)} className="action-btn" disabled={isSending}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="To"
                    value={composeData.recipient}
                    onChange={(e) => setComposeData({ ...composeData, recipient: e.target.value })}
                    onBlur={validateRecipient}
                    className="input-light"
                    disabled={isSending}
                  />
                  {recipientName && (
                    <p className="mt-1 text-sm text-green-600">Sending to: {recipientName}</p>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="input-light"
                  disabled={isSending}
                />
                <textarea
                  placeholder="Compose your email..."
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  className="input-light min-h-[200px] resize-none"
                  disabled={isSending}
                />

                {/* Encryption Steps (shown when sending or completed) */}
                {(isSending || sendSteps.every(s => s.status === "completed")) && (
                  <div className={`border rounded-lg p-4 ${sendSteps.every(s => s.status === "completed") ? "border-green-200 bg-green-50" : "border-blue-100 bg-blue-50"}`}>
                    <p className={`text-sm font-medium mb-3 ${sendSteps.every(s => s.status === "completed") ? "text-green-900" : "text-blue-900"}`}>
                      {sendSteps.every(s => s.status === "completed") ? "Email sent successfully!" : "Encrypting with Kyber512..."}
                    </p>
                    <div className="space-y-2">
                      {sendSteps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            step.status === "completed" ? "bg-green-500 text-white" :
                            step.status === "in_progress" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                          }`}>
                            {step.status === "completed" ? <Check className="w-3 h-3" /> :
                             step.status === "in_progress" ? <Loader2 className="w-3 h-3 animate-spin" /> :
                             index + 1}
                          </div>
                          <span className={`text-sm ${step.status === "pending" ? "text-gray-400" : "text-gray-700"}`}>
                            {step.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                {sendSteps.every(s => s.status === "completed") ? (
                  <div className="flex-1 flex justify-end">
                    <button
                      onClick={() => {
                        setShowCompose(false);
                        setComposeData({ recipient: "", subject: "", body: "" });
                        setRecipientName(null);
                        resetSendSteps();
                      }}
                      className="btn-primary"
                    >
                      <Check className="w-4 h-4" />
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <button className="action-btn" disabled={isSending}>
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button className="action-btn" disabled={isSending}>
                        <Type className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCompose(false)}
                        className="btn-outline"
                        disabled={isSending}
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSendEmail}
                        className="btn-primary"
                        disabled={isSending || !composeData.recipient || !composeData.subject || !composeData.body}
                      >
                        <Send className="w-4 h-4" />
                        {isSending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
