"use client";

import { motion } from "framer-motion";
import { KyberParams } from "@/lib/types";

interface KyberVisualizerProps {
  params: KyberParams | null;
  activeStep: "keygen" | "encap" | "decap" | null;
}

export default function KyberVisualizer({
  params,
  activeStep,
}: KyberVisualizerProps) {
  if (!params) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parameters grid */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">
          Kyber512 Parameters
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ParamBox label="n (degree)" value={params.n} />
          <ParamBox label="k (dimension)" value={params.k} />
          <ParamBox label="q (modulus)" value={params.q} />
          <ParamBox label="η₁" value={params.eta1} />
          <ParamBox label="η₂" value={params.eta2} />
          <ParamBox label="du" value={params.du} />
          <ParamBox label="dv" value={params.dv} />
          <ParamBox label="Shared Secret" value={`${params.shared_secret_size * 8} bits`} />
        </div>
      </div>

      {/* Size information */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Key & Cipher Sizes</h3>
        <div className="space-y-3">
          <SizeBar
            label="Public Key"
            size={params.public_key_size}
            maxSize={2000}
            color="indigo"
          />
          <SizeBar
            label="Private Key"
            size={params.private_key_size}
            maxSize={2000}
            color="purple"
          />
          <SizeBar
            label="Ciphertext"
            size={params.ciphertext_size}
            maxSize={2000}
            color="cyan"
          />
        </div>
      </div>

      {/* Algorithm flow visualization */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-6">
          Kyber KEM Operations
        </h3>

        <div className="relative">
          {/* Connection lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* KeyGen */}
            <OperationCard
              title="KeyGen"
              isActive={activeStep === "keygen"}
              steps={[
                "Generate random seed d",
                "Expand seed to matrix A",
                "Sample secret s and error e",
                "Compute t = As + e",
                "Output (pk, sk) = (t||ρ, s)",
              ]}
              inputs={["Random seed d"]}
              outputs={["Public Key (pk)", "Private Key (sk)"]}
              color="indigo"
            />

            {/* Encapsulation */}
            <OperationCard
              title="Encapsulation"
              isActive={activeStep === "encap"}
              steps={[
                "Generate random m",
                "Derive (K̄, r) = G(H(pk), m)",
                "Encrypt m using r",
                "Compute ciphertext c",
                "Output (c, K)",
              ]}
              inputs={["Public Key (pk)"]}
              outputs={["Ciphertext (c)", "Shared Key (K)"]}
              color="purple"
            />

            {/* Decapsulation */}
            <OperationCard
              title="Decapsulation"
              isActive={activeStep === "decap"}
              steps={[
                "Decrypt c using sk",
                "Recover m'",
                "Re-encrypt m' to get c'",
                "Compare c and c'",
                "Output K or random",
              ]}
              inputs={["Ciphertext (c)", "Private Key (sk)"]}
              outputs={["Shared Key (K)"]}
              color="cyan"
            />
          </div>
        </div>
      </div>

      {/* Mathematical foundation */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">
          Mathematical Foundation
        </h3>
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-indigo-400 mb-2">
              Module-LWE Problem
            </h4>
            <p className="text-gray-400 text-sm">
              Given a random matrix A and t = As + e (where s is secret and e is
              small error), it is computationally hard to recover s. This
              hardness is believed to hold even against quantum computers.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-400 mb-2">
              Polynomial Ring
            </h4>
            <p className="text-gray-400 text-sm font-mono">
              R_q = Z_q[X] / (X^{params.n} + 1)
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Operations are performed in this polynomial ring for efficiency
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-cyan-400 mb-2">
              Number Theoretic Transform (NTT)
            </h4>
            <p className="text-gray-400 text-sm">
              Polynomial multiplication is accelerated using NTT, similar to FFT
              but over finite fields. This enables O(n log n) multiplication
              instead of O(n²).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParamBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-mono text-indigo-400">{value}</p>
    </div>
  );
}

function SizeBar({
  label,
  size,
  maxSize,
  color,
}: {
  label: string;
  size: number;
  maxSize: number;
  color: "indigo" | "purple" | "cyan";
}) {
  const colors = {
    indigo: "from-indigo-600 to-indigo-400",
    purple: "from-purple-600 to-purple-400",
    cyan: "from-cyan-600 to-cyan-400",
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300 font-mono">{size} bytes</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(size / maxSize) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${colors[color]} rounded-full`}
        />
      </div>
    </div>
  );
}

function OperationCard({
  title,
  isActive,
  steps,
  inputs,
  outputs,
  color,
}: {
  title: string;
  isActive: boolean;
  steps: string[];
  inputs: string[];
  outputs: string[];
  color: "indigo" | "purple" | "cyan";
}) {
  const colors = {
    indigo: {
      border: isActive ? "border-indigo-500" : "border-gray-700",
      bg: isActive ? "bg-indigo-900/30" : "bg-gray-800/30",
      title: "text-indigo-400",
      bullet: "bg-indigo-500",
    },
    purple: {
      border: isActive ? "border-purple-500" : "border-gray-700",
      bg: isActive ? "bg-purple-900/30" : "bg-gray-800/30",
      title: "text-purple-400",
      bullet: "bg-purple-500",
    },
    cyan: {
      border: isActive ? "border-cyan-500" : "border-gray-700",
      bg: isActive ? "bg-cyan-900/30" : "bg-gray-800/30",
      title: "text-cyan-400",
      bullet: "bg-cyan-500",
    },
  };

  const c = colors[color];

  return (
    <motion.div
      animate={isActive ? { scale: 1.02 } : { scale: 1 }}
      className={`${c.bg} ${c.border} border rounded-xl p-4 transition-colors`}
    >
      <h4 className={`font-semibold ${c.title} mb-3`}>{title}</h4>

      {/* Inputs */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Inputs:</p>
        <div className="flex flex-wrap gap-1">
          {inputs.map((input, i) => (
            <span
              key={i}
              className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded"
            >
              {input}
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <ol className="space-y-1 mb-3">
        {steps.map((step, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-2 text-xs text-gray-400"
          >
            <span
              className={`${c.bullet} w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white flex-shrink-0 mt-0.5`}
            >
              {i + 1}
            </span>
            {step}
          </motion.li>
        ))}
      </ol>

      {/* Outputs */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Outputs:</p>
        <div className="flex flex-wrap gap-1">
          {outputs.map((output, i) => (
            <span
              key={i}
              className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded"
            >
              {output}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
