import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/stores/themeStore";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      className={`relative grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border text-text transition-colors duration-200 hover:bg-white/5 ${className ?? ""}`}
    >
      {/* Sun / Moon crossfade */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          isDark ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          isDark ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
