type Props = {
  variant?: "light" | "dark";
};

export default function AppFooter({ variant = "light" }: Props) {
  const isDark = variant === "dark";

  return (
    <footer
      className={`print:hidden mt-auto border-t ${
        isDark
          ? "border-white/10 bg-slate-900/40 backdrop-blur-sm"
          : "border-slate-200/80 bg-white/60 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
        <p
          className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          © 2026 YKS Takip
        </p>
        <p
          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          <span className={isDark ? "text-slate-500" : "text-slate-400"}>
            Geliştiren:
          </span>{" "}
          <span
            className={`font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            Emre KESIM
          </span>
        </p>
      </div>
    </footer>
  );
}
