import Link from "next/link";
import { FiShield, FiBookOpen } from "react-icons/fi";

type Props = {
  isAdmin: boolean;
  isTeacher: boolean;
  active: "admin" | "teacher";
};

export default function PanelSwitcher({ isAdmin, isTeacher, active }: Props) {
  if (!isAdmin && !isTeacher) return null;
  if (isAdmin && !isTeacher) {
    return (
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg"
      >
        <FiShield />
        Yönetici
      </Link>
    );
  }
  if (isTeacher && !isAdmin) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
      >
        <FiBookOpen />
        Öğretmen
      </Link>
    );
  }

  return (
    <div className="inline-flex items-center p-0.5 sm:p-1 bg-slate-100 rounded-lg max-w-full">
      <Link
        href="/admin"
        title="Yönetici Paneli"
        className={`inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1.5 rounded-md transition-colors ${
          active === "admin"
            ? "bg-white text-violet-700 shadow-sm"
            : "text-slate-500 hover:text-violet-600"
        }`}
      >
        <FiShield className="shrink-0 text-base" />
        <span className="hidden min-[420px]:inline">Yönetici</span>
      </Link>
      <Link
        href="/dashboard"
        title="Öğretmen Paneli"
        className={`inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1.5 rounded-md transition-colors ${
          active === "teacher"
            ? "bg-white text-blue-700 shadow-sm"
            : "text-slate-500 hover:text-blue-600"
        }`}
      >
        <FiBookOpen className="shrink-0 text-base" />
        <span className="hidden min-[420px]:inline">Öğretmen</span>
      </Link>
    </div>
  );
}
