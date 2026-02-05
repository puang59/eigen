"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Eye, EyeOff, Key, Shield } from "lucide-react";

interface KeyDisplayProps {
  label: string;
  value: string;
  type: "public" | "private";
  showCopy?: boolean;
}

export default function KeyDisplay({
  label,
  value,
  type,
  showCopy = true,
}: KeyDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = showFull
    ? value
    : `${value.substring(0, 32)}...${value.substring(value.length - 16)}`;

  return (
    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-lg ${
              type === "public"
                ? "bg-indigo-600/20 text-indigo-400"
                : "bg-red-600/20 text-red-400"
            }`}
          >
            {type === "public" ? (
              <Key className="w-4 h-4" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFull(!showFull)}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-colors"
            title={showFull ? "Hide full key" : "Show full key"}
          >
            {showFull ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>

          {showCopy && (
            <button
              onClick={copyToClipboard}
              className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Check className="w-4 h-4 text-green-400" />
                </motion.div>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      <div
        className={`
          font-mono text-xs break-all p-3 rounded-lg
          ${
            type === "public"
              ? "bg-gray-800/50 text-gray-400"
              : "bg-red-900/10 text-red-300/70"
          }
          ${showFull ? "max-h-40 overflow-y-auto" : ""}
        `}
      >
        {displayValue}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            type === "public"
              ? "bg-indigo-900/30 text-indigo-400"
              : "bg-red-900/30 text-red-400"
          }`}
        >
          {type === "public" ? "Share freely" : "Keep secret"}
        </span>
        <span className="text-xs text-gray-600">
          {value.length} characters
        </span>
      </div>
    </div>
  );
}
