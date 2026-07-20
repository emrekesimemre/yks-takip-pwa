"use client";

import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-2 text-sm sm:text-base text-slate-500 hover:text-red-600 transition-colors font-medium px-3 sm:px-4 py-2.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 shrink-0"
    >
      <FiLogOut className="text-lg sm:text-xl" />
      <span className="hidden sm:inline">Çıkış</span>
    </button>
  );
}
