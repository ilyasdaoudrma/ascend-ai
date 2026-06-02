import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function Navbar() {
  const { t } = useTranslation();
  const { status, user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full glass px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <img src="/logo.png" alt="Ascend AI" className="h-9 w-9 rounded-lg" />
          <span className="text-gradient text-lg">Ascend AI</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <a href="/#features" className="transition-colors hover:text-text">{t("landing.features")}</a>
          <a href="/#how" className="transition-colors hover:text-text">{t("landing.how")}</a>
          <a href="/#coach" className="transition-colors hover:text-text">{t("landing.coach")}</a>
          <a href="/#pricing" className="transition-colors hover:text-text">{t("landing.pricing")}</a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {status === "authenticated" ? (
            <>
              <Link to="/dashboard" className="btn-ghost hidden sm:inline-flex">
                {t("landing.dashboard")}
              </Link>
              <button className="btn-primary" onClick={() => { logout(); navigate("/"); }}>
                {user?.full_name?.split(" ")[0] ?? t("common.logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost hidden sm:inline-flex">
                {t("landing.login")}
              </Link>
              <Link to="/register" className="btn-primary">
                {t("landing.getStarted")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
