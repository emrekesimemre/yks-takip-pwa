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
        className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-violet-700 bg-violet-50 px-4 py-2.5 rounded-lg"
      >
        <FiShield className="text-lg" />
        Yönetici
      </Link>
    );
  }
  if (isTeacher && !isAdmin) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-blue-700 bg-blue-50 px-4 py-2.5 rounded-lg"
      >
        <FiBookOpen className="text-lg" />
        Öğretmen
      </Link>
    );
  }

  return (
    <div className="inline-flex items-center p-1 sm:p-1.5 bg-slate-100 rounded-xl max-w-full">
      <Link
        href="/admin"
        title="Yönetici Paneli"
        className={`inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors ${
          active === "admin"
            ? "bg-white text-violet-700 shadow-sm"
            : "text-slate-500 hover:text-violet-600"
        }`}
      >
        <FiShield className="shrink-0 text-lg sm:text-xl" />
        <span className="hidden min-[420px]:inline">Yönetici</span>
      </Link>
      <Link
        href="/dashboard"
        title="Öğretmen Paneli"
        className={`inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors ${
          active === "teacher"
            ? "bg-white text-blue-700 shadow-sm"
            : "text-slate-500 hover:text-blue-600"
        }`}
      >
        <FiBookOpen className="shrink-0 text-lg sm:text-xl" />
        <span className="hidden min-[420px]:inline">Öğretmen</span>
      </Link>
    </div>
  );
}
