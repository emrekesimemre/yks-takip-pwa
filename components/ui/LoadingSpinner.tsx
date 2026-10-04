"use client";

import { motion } from "framer-motion";
import { BrandIconMark } from "@/lib/brand-icon";

type Props = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { box: 52, logo: 32 },
  md: { box: 88, logo: 56 },
  lg: { box: 104, logo: 68 },
};

export default function LoadingSpinner({
  label = "Yükleniyor...",
  size = "md",
}: Props) {
  const { box, logo } = sizes[size];

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div
        className="relative flex items-center justify-center"
        style={{ width: box, height: box }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 border-r-indigo-500" />
        </motion.div>
        <BrandIconMark size={logo} />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-medium text-slate-500"
      >
        {label}
      </motion.p>
    </div>
  );
}
