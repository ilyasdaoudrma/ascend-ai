import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LANGS, setLanguage, currentLanguage, type Lang } from "@/i18n";

const LABEL: Record<Lang, string> = { en: "EN", fr: "FR", ar: "ع" };
const FULL: Record<Lang, string> = { en: "English", fr: "Français", ar: "العربية" };

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = (i18n.language as Lang) ?? currentLanguage();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
        className="grid h-9 min-w-9 cursor-pointer place-items-center rounded-full border border-border px-2.5 text-sm font-semibold text-text transition-colors duration-200 hover:bg-white/5"
      >
        {LABEL[active] ?? "EN"}
      </button>
      {open && (
        <div className="absolute end-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          {LANGS.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-white/5 ${
                active === lang ? "text-accent" : "text-text"
              }`}
            >
              {FULL[lang]}
              {active === lang && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
