"use client";

import { motion } from "framer-motion";

type Props = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export default function LoadingSpinner({
  label = "Yükleniyor...",
  size = "md",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div
        className={`${sizes[size]} relative`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 border-r-indigo-500" />
      </motion.div>
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
