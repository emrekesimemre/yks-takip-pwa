"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";

export default function LoginButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors py-3.5 px-4 rounded-xl font-semibold shadow-sm hover:shadow-md"
    >
      <FcGoogle className="text-2xl" />
      Google ile Giriş Yap
    </motion.button>
  );
}
