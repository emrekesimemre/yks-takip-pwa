"use client";

import { useSyncExternalStore } from "react";
import { FiSmartphone, FiX } from "react-icons/fi";

const DISMISS_KEY = "yks-pwa-install-dismissed";
const INSTALL_READY = "yks-beforeinstallprompt";
const INSTALL_CHANGED = "yks-install-changed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallWindow = Window & {
  __yksInstallBound?: boolean;
  __yksInstallPrompt?: BeforeInstallPromptEvent;
};

type InstallMode = "hidden" | "ios-safari" | "ios-other" | "android-prompt" | "android-manual";

function isStandalonePwa() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

function isPhone() {
  const narrow = window.matchMedia("(max-width: 768px)").matches;
  const tablet =
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(max-width: 1180px)").matches;
  return narrow || tablet;
}

function isIosDevice() {
  const ua = navigator.userAgent;
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOs;
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua);
  return /Safari/i.test(ua) && !otherBrowser;
}

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent);
}

function isDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return true;
  }
}

function rememberDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Private mode can block storage; hiding for this visit is enough.
  }
}

function notifyInstallChange() {
  window.dispatchEvent(new Event(INSTALL_CHANGED));
}

function shouldOfferInstall() {
  if (!isPhone() || isStandalonePwa() || isDismissed()) return false;
  return isIosDevice() || isAndroidDevice();
}

function bindInstallPrompt() {
  if (typeof window === "undefined") return;
  const installWindow = window as InstallWindow;
  if (installWindow.__yksInstallBound) return;
  installWindow.__yksInstallBound = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    if (!shouldOfferInstall()) return;
    event.preventDefault();
    installWindow.__yksInstallPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(INSTALL_READY));
  });

  window.addEventListener("appinstalled", () => {
    rememberDismissed();
    notifyInstallChange();
  });
}

function getInstallMode(): InstallMode {
  if (!shouldOfferInstall()) return "hidden";
  if (isIosDevice()) return isIosSafari() ? "ios-safari" : "ios-other";
  if ((window as InstallWindow).__yksInstallPrompt) return "android-prompt";
  return "android-manual";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(INSTALL_READY, onStoreChange);
  window.addEventListener(INSTALL_CHANGED, onStoreChange);
  return () => {
    window.removeEventListener(INSTALL_READY, onStoreChange);
    window.removeEventListener(INSTALL_CHANGED, onStoreChange);
  };
}

function installMessage(mode: InstallMode) {
  if (mode === "ios-safari") {
    return "Safari’de paylaş simgesine (kare ve yukarı ok) basın, ardından Ana Ekrana Ekle’yi seçin.";
  }
  if (mode === "ios-other") {
    return "Sayfayı Safari’de açın. Paylaş simgesine basıp Ana Ekrana Ekle’yi seçin.";
  }
  if (mode === "android-prompt") {
    return "Panel telefonda uygulama gibi açılsın.";
  }
  return "Chrome’da sağ üstteki üç noktaya basın ve Uygulamayı yükle’yi seçin.";
}

bindInstallPrompt();

export default function InstallPrompt() {
  const mode = useSyncExternalStore(subscribe, getInstallMode, () => "hidden" as const);

  async function install() {
    const promptEvent = (window as InstallWindow).__yksInstallPrompt;
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    (window as InstallWindow).__yksInstallPrompt = undefined;
    if (choice.outcome === "accepted") rememberDismissed();
    notifyInstallChange();
  }

  function dismiss() {
    rememberDismissed();
    notifyInstallChange();
  }

  if (mode === "hidden") return null;

  return (
    <section
      className="print:hidden mb-6 rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-indigo-50 px-4 py-3 shadow-sm"
      aria-label="Uygulamayı ana ekrana ekle"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600">
          <FiSmartphone className="text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Ana ekrana ekleyin</p>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{installMessage(mode)}</p>
          {mode === "android-prompt" && (
            <button
              type="button"
              onClick={install}
              className="mt-3 inline-flex items-center rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Uygulamayı yükle
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Kapat"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
        >
          <FiX aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
