"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Send,
  Inbox,
  Star,
  Archive,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useState, useEffect } from "react";
import { getEmailsByFolder } from "@/lib/db";

interface FolderItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  folder?: string;
  count?: number;
}

interface SidebarProps {
  onCompose?: () => void;
}

export default function Sidebar({ onCompose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [inboxCount, setInboxCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    async function loadCounts() {
      try {
        const inboxEmails = await getEmailsByFolder("inbox");
        const sentEmails = await getEmailsByFolder("sent");
        setInboxCount(inboxEmails.length);
        setSentCount(sentEmails.length);
      } catch (error) {
        console.error("Failed to load email counts:", error);
      }
    }
    loadCounts();
    
    // Refresh counts periodically
    const interval = setInterval(loadCounts, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentFolder = searchParams.get("folder");

  const folders: FolderItem[] = [
    { id: "inbox", label: "Inbox", icon: Inbox, href: "/inbox", folder: undefined, count: inboxCount },
    { id: "sent", label: "Sent", icon: Send, href: "/inbox?folder=sent", folder: "sent", count: sentCount },
    { id: "visualizer", label: "Visualizer", icon: Eye, href: "/visualizer" },
  ];

  const isActiveFolder = (folder: FolderItem) => {
    if (folder.id === "visualizer") {
      return pathname === "/visualizer";
    }
    if (pathname !== "/inbox") return false;
    if (folder.folder === undefined) {
      return !currentFolder || currentFolder === "inbox";
    }
    return currentFolder === folder.folder;
  };

  return (
    <aside className="w-64 h-screen sidebar flex flex-col">
      {/* New Email Button */}
      <div className="p-4">
        <button
          onClick={onCompose}
          className="w-full btn-primary justify-center py-3"
        >
          <Plus className="w-4 h-4" />
          New Email
        </button>
      </div>

      {/* Folders */}
      <div className="px-3 flex-1">
        <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Folders
        </p>
        <nav className="space-y-1">
          {folders.map((folder) => {
            const Icon = folder.icon;
            const isActive = isActiveFolder(folder);

            return (
              <button
                key={folder.id}
                onClick={() => router.push(folder.href)}
                className={`sidebar-item w-full text-left ${isActive ? "active" : ""}`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{folder.label}</span>
                {folder.count !== undefined && folder.count > 0 && (
                  <span className={`text-sm ${isActive ? "text-white/80" : "text-gray-400"}`}>
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User info at bottom */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user.name?.charAt(0) || user.username.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name || user.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.username}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
