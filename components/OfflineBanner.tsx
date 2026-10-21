"use client";

import { useEffect, useState } from "react";
import { FiWifiOff } from "react-icons/fi";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let offlineTimer: number | undefined;
    let probeController: AbortController | undefined;

    const verifyConnection = async () => {
      probeController?.abort();
      probeController = new AbortController();
      const timeout = window.setTimeout(() => probeController?.abort(), 3000);

      try {
        await fetch("/icons/icon-192.png", {
          cache: "no-store",
          signal: probeController.signal,
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const handleOnline = () => {
      window.clearTimeout(offlineTimer);
      setIsOnline(true);
      void verifyConnection();
    };

    const handleOffline = () => {
      window.clearTimeout(offlineTimer);
      offlineTimer = window.setTimeout(() => {
        void verifyConnection();
      }, 1500);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.clearTimeout(offlineTimer);
      probeController?.abort();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
        MentorApp&apos;i kullanmaya devam etmek için lütfen Wi-Fi veya hücresel veri
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
