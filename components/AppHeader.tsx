"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import PanelSwitcher from "@/components/PanelSwitcher";
import { FiBookOpen } from "react-icons/fi";

type Props = {
  userName?: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
};

export default function AppHeader({ userName, isAdmin, isTeacher }: Props) {
  const pathname = usePathname();
  const isStudentPage = pathname.startsWith("/dashboard/student/");

  return (
    <header className="glass-header sticky top-0 z-40 print:hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 min-w-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
            <FiBookOpen className="text-white text-lg" />
          </div>
          <div className="hidden sm:block">
            <div className="font-bold text-lg text-slate-900 tracking-tight leading-none">
              YKS Takip
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Öğrenci Yönetimi
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <PanelSwitcher
            isAdmin={isAdmin}
            isTeacher={isTeacher}
            active="teacher"
          />
          {isStudentPage && (
            <Link
              href="/dashboard"
              className="hidden md:inline-flex text-sm font-medium text-slate-600 hover:text-blue-600 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              ← Öğrenciler
            </Link>
          )}
          {userName && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-blue-700">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 max-w-[140px] truncate">
                {userName}
              </span>
            </div>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
