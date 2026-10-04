"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { DropdownPanel } from "@/components/ui/soft-motion";
import {
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiLogOut,
  FiShield,
} from "react-icons/fi";

type Props = {
  isAdmin: boolean;
  isTeacher: boolean;
  active: "admin" | "teacher";
};

const panels = [
  {
    id: "teacher" as const,
    href: "/dashboard",
    label: "Öğretmen paneli",
    description: "Öğrenciler, plan ve denemeler",
    icon: FiBookOpen,
    iconClass: "bg-blue-50 text-blue-600",
    activeClass: "bg-blue-50",
  },
  {
    id: "admin" as const,
    href: "/admin",
    label: "Yönetici paneli",
    description: "Tüm kadro ve genel durum",
    icon: FiShield,
    iconClass: "bg-violet-50 text-violet-600",
    activeClass: "bg-violet-50",
  },
];

export default function PanelSwitcher({
  isAdmin,
  isTeacher,
  active,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!isAdmin && !isTeacher) return null;

  if (!(isAdmin && isTeacher)) {
    if (isAdmin) {
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

  const current = panels.find((panel) => panel.id === active) ?? panels[0];
  const CurrentIcon = current.icon;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border bg-white px-2.5 sm:px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 ${
          open
            ? "border-slate-300 ring-2 ring-slate-200"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${current.iconClass}`}
        >
          <CurrentIcon className="text-base" />
        </span>
        <span>{current.label}</span>
        <FiChevronDown
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <DropdownPanel
        open={open}
        role="menu"
        className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
      >
          {panels.map((panel) => {
            const Icon = panel.icon;
            const isCurrent = panel.id === active;

            return (
              <Link
                key={panel.id}
                href={panel.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-slate-50 ${
                  isCurrent ? panel.activeClass : ""
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${panel.iconClass}`}
                >
                  <Icon className="text-lg" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">
                    {panel.label}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {panel.description}
                  </span>
                </span>
                {isCurrent && (
                  <FiCheck className="shrink-0 text-base text-slate-400" />
                )}
              </Link>
            );
          })}

          <div className="my-1.5 border-t border-slate-100" />

          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <FiLogOut className="text-lg" />
            </span>
            <span>Çıkış yap</span>
          </button>
      </DropdownPanel>
    </div>
  );
}
