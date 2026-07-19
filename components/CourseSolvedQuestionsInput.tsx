"use client";

import { useState } from "react";

type Props = {
  label?: string;
  value: number;
  onChange: (value: number) => void;
};

export default function CourseSolvedQuestionsInput({
  label = "Çözülen soru",
  value,
  onChange,
}: Props) {
  const [local, setLocal] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = isFocused ? local : value ? String(value) : "";

  const commit = () => {
    const num = parseInt(local, 10);
    onChange(Number.isNaN(num) || num < 0 ? 0 : num);
  };

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
      <label className="text-xs text-slate-500 shrink-0 font-medium">{label}</label>
      <input
        type="number"
        min={0}
        value={displayValue}
        onFocus={() => {
          setLocal(value ? String(value) : "");
          setIsFocused(true);
        }}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          setIsFocused(false);
          commit();
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="w-24 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-all"
        placeholder="0"
      />
    </div>
  );
}
