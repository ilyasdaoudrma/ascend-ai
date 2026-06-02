import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 flex items-center gap-2 font-bold">
            <img src="/logo.png" alt="Ascend AI" className="h-9 w-9 rounded-lg" />
            <span className="text-gradient text-lg">Ascend AI</span>
          </Link>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        </div>
      </div>

      {/* Visual side */}
      <div className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(40rem 40rem at 70% 30%, rgba(124,92,255,0.35), transparent 60%), radial-gradient(30rem 30rem at 30% 80%, rgba(34,211,238,0.25), transparent 60%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-14">
          <blockquote className="text-2xl font-semibold leading-snug">
            “{t("auth.quote")}”
          </blockquote>
          <p className="mt-4 text-sm text-muted">{t("auth.quoteAuthor")}</p>
        </div>
      </div>
    </div>
  );
}
