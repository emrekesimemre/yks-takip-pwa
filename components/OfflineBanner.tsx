"use client";

import { useSyncExternalStore } from "react";
import { FiWifiOff } from "react-icons/fi";

// 1. Tarayıcının online/offline event'lerini dinleyen abone fonksiyonu
function subscribe(callback: () => void) {
  if (typeof window !== "undefined") {
    window.addEventListener("online", callback);
    window.addEventListener("offline", callback);
    return () => {
      window.removeEventListener("online", callback);
      window.removeEventListener("offline", callback);
    };
  }
  return () => {};
}

// 2. İstemcideki (Client) anlık durumu okuyan fonksiyon
function getSnapshot() {
  if (typeof navigator !== "undefined") {
    return navigator.onLine;
  }
  return true;
}

// 3. Sunucuda (SSR) sayfa oluşturulurken varsayılan durumu okuyan fonksiyon
function getServerSnapshot() {
  return true; // Sunucuda her zaman online kabul ediyoruz ki hata vermesin
}

export default function OfflineBanner() {
  // useEffect ve useState yerine React'in dış veri okuma kancasını kullanıyoruz
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <FiWifiOff className="text-4xl text-rose-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">
        İnternet Bağlantısı Koptu
      </h2>
      <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
        MentorApp'i kullanmaya devam etmek için lütfen Wi-Fi veya hücresel veri
        bağlantınızı kontrol edin.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
