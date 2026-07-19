import Link from "next/link";
import { FiRefreshCw, FiWifiOff } from "react-icons/fi";

export default function OfflinePage() {
  return (
    <main className="min-h-screen login-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-500">
          <FiWifiOff className="text-3xl" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Çevrimdışısınız</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            İnternet bağlantınız yok. Bağlantı geri geldiğinde sayfayı yenileyerek
            devam edebilirsiniz.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 btn-primary w-full"
        >
          <FiRefreshCw />
          Yeniden Dene
        </Link>
      </div>
    </main>
  );
}
