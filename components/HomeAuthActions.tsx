import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { FiShield, FiBookOpen } from "react-icons/fi";

type Props = {
  userName?: string | null;
  isAdmin?: boolean;
  isTeacher?: boolean;
};

export default function HomeAuthActions({ userName, isAdmin, isTeacher }: Props) {
  return (
    <div className="space-y-4">
      {userName && (
        <p className="text-sm text-slate-600 text-center">
          Hoş geldin,{" "}
          <span className="font-semibold text-slate-800">{userName}</span>
        </p>
      )}

      <div className="space-y-3">
        {isAdmin && (
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 transition-colors py-3.5 px-4 rounded-xl font-semibold shadow-md shadow-violet-500/25 hover:shadow-lg"
          >
            <FiShield className="text-xl" />
            Yönetici Paneli
          </Link>
        )}

        {isTeacher && (
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors py-3.5 px-4 rounded-xl font-semibold shadow-sm hover:shadow-md"
          >
            <FiBookOpen className="text-xl text-blue-600" />
            Öğretmen Paneli
          </Link>
        )}
      </div>

      <div className="flex justify-center pt-1">
        <LogoutButton />
      </div>
    </div>
  );
}
