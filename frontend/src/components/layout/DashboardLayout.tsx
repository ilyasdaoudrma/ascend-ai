import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useUnreadCount, useChatUnread } from "@/features/social/hooks";
import { Avatar } from "@/features/social/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { PageTransition } from "@/components/motion/PageTransition";
import { AuroraBackground } from "@/components/motion/AuroraBackground";

const NAV = [
  { to: "/dashboard", key: "overview", icon: "◉" },
  { to: "/dashboard/checkin", key: "checkin", icon: "✓" },
  { to: "/dashboard/coach", key: "coach", icon: "🧠", pro: true },
  { to: "/dashboard/workouts", key: "workouts", icon: "🏋" },
  { to: "/dashboard/analytics", key: "analytics", icon: "📈" },
  { to: "/dashboard/nutrition", key: "nutrition", icon: "🍽" },
  { to: "/dashboard/goals", key: "goals", icon: "◎" },
  { to: "/dashboard/achievements", key: "achievements", icon: "★" },
];

const SOCIAL_NAV = [
  { to: "/dashboard/feed", key: "community", icon: "🌐" },
  { to: "/dashboard/activity", key: "activity", icon: "⚡" },
  { to: "/dashboard/messages", key: "messages", icon: "✉️", badge: "chat" },
  { to: "/dashboard/friends", key: "friends", icon: "🤝" },
  { to: "/dashboard/groups", key: "groups", icon: "👥" },
  { to: "/dashboard/challenges", key: "challenges", icon: "🏁" },
  { to: "/dashboard/leaderboard", key: "leaderboard", icon: "🏅" },
  { to: "/dashboard/notifications", key: "notifications", icon: "🔔", badge: "notif" },
];

const linkClass = (isActive: boolean) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${
    isActive ? "bg-accent/15 text-text" : "text-muted hover:bg-white/5 hover:text-text"
  }`;

export function DashboardLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: unread = 0 } = useUnreadCount();
  const { data: chatUnread = 0 } = useChatUnread();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const sidebar = (onNavigate: () => void) => (
    <>
      <Link to="/dashboard" onClick={onNavigate} className="mb-8 flex items-center gap-2 font-bold">
        <img src="/logo.png" alt="Ascend AI" className="h-9 w-9 rounded-lg" />
        <span className="text-gradient">Ascend AI</span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto" data-lenis-prevent>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/dashboard"} onClick={onNavigate}
            className={({ isActive }) => linkClass(isActive)}>
            <span className="w-5 text-center">{item.icon}</span>
            <span className="flex-1">{t(`nav.${item.key}`)}</span>
            {item.pro && (
              <span className="rounded-full bg-gradient-to-r from-accent to-cyan-400 px-1.5 py-0.5 text-[9px] font-bold text-white">
                PRO
              </span>
            )}
          </NavLink>
        ))}

        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted">
          {t("nav.sectionCommunity")}
        </p>
        {SOCIAL_NAV.map((item) => {
          const badge = item.badge === "notif" ? unread : item.badge === "chat" ? chatUnread : 0;
          return (
            <NavLink key={item.to} to={item.to} onClick={onNavigate}
              className={({ isActive }) => linkClass(isActive)}>
              <span className="w-5 text-center">{item.icon}</span>
              <span className="flex-1">{t(`nav.${item.key}`)}</span>
              {badge > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {user?.is_staff && (
          <>
            <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {t("nav.sectionAdmin")}
            </p>
            <NavLink to="/dashboard/admin" onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${
                  isActive ? "bg-danger/15 text-danger" : "text-muted hover:bg-white/5 hover:text-text"
                }`
              }>
              <span className="w-5 text-center">🛡</span>
              {t("nav.adminPanel")}
            </NavLink>
          </>
        )}
      </nav>

      <div className="mt-4 border-t border-border pt-4">
        <Link to="/dashboard/settings" onClick={onNavigate}
          className="mb-3 flex items-center gap-3 rounded-xl p-1 transition-colors duration-200 hover:bg-white/5">
          {user && (
            <Avatar
              user={{
                id: user.id, username: user.username, full_name: user.full_name,
                avatar: user.profile?.avatar ?? null,
                accent_color: user.profile?.accent_color ?? "#7c5cff",
              }}
              size={36}
              linked={false}
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.full_name}</p>
            <p className="truncate text-xs text-muted">{t("nav.viewSettings")}</p>
          </div>
        </Link>
        <button onClick={() => { onNavigate(); logout(); navigate("/"); }}
          className="btn-ghost w-full justify-start text-sm">
          {t("common.logout")}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-30 hidden h-screen w-64 flex-col border-e border-border bg-surface/60 p-5 backdrop-blur md:flex">
        {sidebar(() => {})}
      </aside>

      {/* Mobile drawer + backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-border bg-surface p-5 transition-transform duration-300 ease-smooth md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        {sidebar(() => setMobileOpen(false))}
      </aside>

      {/* Content */}
      <main className="relative flex-1 px-5 py-6 md:px-10">
        <AuroraBackground />

        {/* Mobile top bar */}
        <div className="mb-4 flex items-center justify-between md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-text transition-colors hover:bg-white/5"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 font-bold">
            <img src="/logo.png" alt="Ascend AI" className="h-8 w-8 rounded-lg" />
            <span className="text-gradient">Ascend AI</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Desktop control bar */}
        <div className="mb-4 hidden items-center justify-end gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <div className="mx-auto max-w-5xl">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
