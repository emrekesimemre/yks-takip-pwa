"use client";

import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-1.5 sm:gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors font-medium px-2 sm:px-3 py-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 shrink-0"
    >
      <FiLogOut />
      <span className="hidden sm:inline">Çıkış</span>
    </button>
  );
}
