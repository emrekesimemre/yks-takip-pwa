"use client";

import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import PanelSwitcher from "@/components/PanelSwitcher";
import { BrandIconMark } from "@/lib/brand-icon";

type Props = {
  userName?: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
};

export default function AdminHeader({ userName, isAdmin, isTeacher }: Props) {
  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 min-w-0">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 shrink-0"
        >
          <BrandIconMark size={44} className="shrink-0" />
          <div className="hidden sm:block">
            <div className="font-bold text-lg text-slate-900 tracking-tight leading-none">
              YKS Takip
            </div>
            <div className="text-[10px] text-violet-500 font-medium tracking-wide uppercase">
              Yönetici Paneli
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <PanelSwitcher
            isAdmin={isAdmin}
            isTeacher={isTeacher}
            active="admin"
          />
          {userName && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-sm font-bold text-violet-700">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 max-w-[140px] truncate">
                {userName}
              </span>
            </div>
          )}
          {!(isAdmin && isTeacher) && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}
