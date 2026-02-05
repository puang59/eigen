"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Send,
  Key,
  Shield,
  Eye,
  Copy,
  Check,
  Inbox,
  Clock,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast, { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/auth";
import { getEmails } from "@/lib/db";
import { Email } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();
  const [recentEmails, setRecentEmails] = useState<Email[]>([]);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    async function loadEmails() {
      const emails = await getEmails(3);
      setRecentEmails(emails);
    }
    if (isAuthenticated) {
      loadEmails();
    }
  }, [isAuthenticated]);

  const copyPublicKey = async () => {
    if (user?.publicKey) {
      await navigator.clipboard.writeText(user.publicKey);
      setCopiedKey(true);
      showToast("Public key copied to clipboard", "success");
      setTimeout(() => setCopiedKey(false), 2000);
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
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.name}
          </h1>
          <p className="text-gray-400">
            Your quantum-secure communications dashboard
          </p>
        </motion.div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            href="/compose"
            icon={<Send className="w-6 h-6" />}
            title="Compose Email"
            description="Send encrypted message"
            color="indigo"
          />
          <QuickActionCard
            href="/inbox"
            icon={<Inbox className="w-6 h-6" />}
            title="Inbox"
            description="View received emails"
            color="purple"
          />
          <QuickActionCard
            href="/visualizer"
            icon={<Eye className="w-6 h-6" />}
            title="Kyber Visualizer"
            description="Explore encryption"
            color="cyan"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User info card */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-600/20 rounded-lg">
                <Key className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Your Kyber512 Keys
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Username
                </label>
                <div className="bg-gray-900/50 rounded-lg px-4 py-3 text-gray-200 font-mono">
                  {user.username}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Public Key (share with others)
                </label>
                <div className="bg-gray-900/50 rounded-lg px-4 py-3 text-gray-400 font-mono text-xs break-all relative group">
                  {user.publicKey.substring(0, 64)}...
                  <button
                    onClick={copyPublicKey}
                    className="absolute top-2 right-2 p-2 bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy full key"
                  >
                    {copiedKey ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Private key securely stored</span>
              </div>
            </div>
          </Card>

          {/* Recent emails card */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Recent Emails
                </h2>
              </div>
              <Link
                href="/inbox"
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                View all
              </Link>
            </div>

            {recentEmails.length > 0 ? (
              <div className="space-y-3">
                {recentEmails.map((email, index) => (
                  <motion.div
                    key={email.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-900/50 rounded-lg p-3 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-200">
                        {email.sender}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(email.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {email.subject}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No emails yet</p>
                <p className="text-sm">Sync your inbox to see messages</p>
              </div>
            )}

            <div className="mt-4">
              <Link href="/inbox">
                <Button variant="secondary" className="w-full">
                  <Inbox className="w-4 h-4 mr-2" />
                  Sync Inbox
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Security info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-600/20 rounded-xl">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Your Communications are Quantum-Secure
                </h3>
                <p className="text-gray-400 text-sm">
                  All your emails are encrypted using Kyber512, a post-quantum
                  key encapsulation mechanism approved by NIST. Combined with
                  AES-256 symmetric encryption, your messages are protected
                  against both classical and quantum computer attacks.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "indigo" | "purple" | "cyan";
}) {
  const colors = {
    indigo: "bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600/30",
    purple: "bg-purple-600/20 text-purple-400 group-hover:bg-purple-600/30",
    cyan: "bg-cyan-600/20 text-cyan-400 group-hover:bg-cyan-600/30",
  };

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="group bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-colors cursor-pointer"
      >
        <div
          className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4 transition-colors`}
        >
          {icon}
        </div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </motion.div>
    </Link>
  );
}
