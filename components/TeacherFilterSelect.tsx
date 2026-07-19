"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiCheck, FiUser } from "react-icons/fi";

type Option = {
  value: string;
  label: string;
  description?: string;
};

type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export default function TeacherFilterSelect({ value, options, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Öğretmen
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-left text-base font-medium text-slate-800 shadow-sm hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <FiUser className="text-lg text-violet-600" />
          </span>
          <span className="min-w-0">
            <span className="block truncate">{selected?.label}</span>
            {selected?.description && (
              <span className="block text-xs font-normal text-slate-400 truncate mt-0.5">
                {selected.description}
              </span>
            )}
          </span>
        </span>
        <FiChevronDown
          className={`text-xl text-slate-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <ul role="listbox" className="max-h-72 overflow-y-auto py-2">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "bg-violet-50 text-violet-800"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-medium truncate">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="block text-xs text-slate-400 truncate mt-0.5">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <FiCheck className="text-lg text-violet-600 shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
