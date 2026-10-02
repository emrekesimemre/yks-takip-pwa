"use client";

import { useEffect, useState } from "react";

const THRESHOLD = 72;

function isStandalonePwa() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

function gestureBlocked(target: EventTarget | null) {
  if (!(target instanceof Element)) return true;
  if (document.body.style.overflow === "hidden") return true;
  if (target.closest("input, textarea, select, [contenteditable='true']")) {
    return true;
  }

  let el: Element | null = target;
  while (el && el !== document.documentElement) {
    const { overflowY } = getComputedStyle(el);
    const scrollable =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      el.scrollHeight > el.clientHeight + 1;
    if (scrollable && el.scrollTop > 0) return true;
    el = el.parentElement;
  }

  return window.scrollY > 2;
}

export default function PullToRefresh() {
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (!isStandalonePwa()) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let pulled = 0;

    const clear = () => {
      tracking = false;
      pulled = 0;
      setDistance(0);
    };

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      if (gestureBlocked(event.target)) {
        tracking = false;
        return;
      }
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      pulled = 0;
      tracking = true;
    };

    const onMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return;

      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        clear();
        return;
      }

      if (dy <= 0 || window.scrollY > 2) {
        pulled = 0;
        setDistance(0);
        return;
      }

      pulled = Math.min(dy * 0.5, 108);
      setDistance(pulled);
      if (dy > 12) event.preventDefault();
    };

    const onEnd = () => {
      if (!tracking) return;
      if (pulled >= THRESHOLD) {
        window.location.reload();
        return;
      }
      clear();
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", clear);

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", clear);
    };
  }, []);

  if (distance < 10) return null;

  const ready = distance >= THRESHOLD;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[80] flex justify-center"
      style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      aria-live="polite"
    >
      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-lg ring-1 ring-slate-200">
        {ready ? "Bırak, yenilensin" : "Yenilemek için çek"}
      </span>
    </div>
  );
}
