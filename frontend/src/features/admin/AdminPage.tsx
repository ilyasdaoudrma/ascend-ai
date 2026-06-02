import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Stat } from "@/components/ui/primitives";
import { fmtDate } from "@/lib/format";
import { useAuthStore } from "@/stores/authStore";
import { useAdminStats, useAdminUsers, useAdminActions } from "./hooks";
import type { AdminUser } from "@/lib/types";

export function AdminPage() {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const { data: stats } = useAdminStats();
  const { data: users = [], isLoading } = useAdminUsers(search);
  const { ban, unban, remove } = useAdminActions();
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banDays, setBanDays] = useState(7);
  const [banReason, setBanReason] = useState("");

  // Guard: non-staff users never reach the panel.
  if (me && !me.is_staff) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
        <p className="text-sm text-muted">{t("admin.subtitle")}</p>
      </header>

      {stats && (
        <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card><Stat label={t("admin.statUsers")} value={stats.total_users} /></Card>
          <Card><Stat label={t("admin.statActiveToday")} value={stats.active_today} /></Card>
          <Card><Stat label={t("admin.statBanned")} value={stats.banned} /></Card>
          <Card><Stat label={t("admin.statStaff")} value={stats.staff} /></Card>
          <Card><Stat label={t("admin.statPosts")} value={stats.total_posts} /></Card>
          <Card><Stat label={t("admin.statWorkouts")} value={stats.total_workouts} /></Card>
        </section>
      )}

      <input
        className="input max-w-sm"
        placeholder={t("admin.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-start text-xs uppercase tracking-wide text-muted">
              <th className="p-4 text-start">{t("admin.colUser")}</th>
              <th className="p-4 text-start">{t("admin.colJoined")}</th>
              <th className="p-4 text-start">{t("admin.colStatus")}</th>
              <th className="p-4 text-end">{t("admin.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="p-4 text-muted">{t("common.loading")}</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/60">
                <td className="p-4">
                  <p className="font-medium">{u.full_name || "—"}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </td>
                <td className="p-4 text-muted">{fmtDate(u.date_joined)}</td>
                <td className="p-4">
                  {u.is_staff ? (
                    <span className="chip text-accent">{t("admin.staff")}</span>
                  ) : u.is_banned ? (
                    <span className="chip text-danger">{t("admin.banned")}</span>
                  ) : (
                    <span className="chip text-success">{t("admin.active")}</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    {!u.is_staff && (
                      <>
                        {u.is_banned ? (
                          <button onClick={() => unban.mutate(u.id)} className="btn-ghost px-3 py-1.5 text-xs">
                            {t("admin.unban")}
                          </button>
                        ) : (
                          <button onClick={() => setBanTarget(u)} className="btn-ghost px-3 py-1.5 text-xs">
                            {t("admin.ban")}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(t("admin.confirmDelete", { email: u.email }))) remove.mutate(u.id);
                          }}
                          className="rounded-full bg-danger/15 px-3 py-1.5 text-xs text-danger hover:bg-danger/25"
                        >
                          {t("admin.delete")}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Ban modal */}
      {banTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur"
          onClick={() => setBanTarget(null)}>
          <Card className="w-full max-w-sm" >
            <div onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold">{t("admin.banTitle", { name: banTarget.full_name || banTarget.email })}</h2>
              <p className="mt-1 text-sm text-muted">{t("admin.banDesc")}</p>
              <div className="mt-4">
                <label className="label">{t("admin.durationDays")}</label>
                <input type="number" min={1} className="input" value={banDays}
                  onChange={(e) => setBanDays(Number(e.target.value))} />
              </div>
              <div className="mt-3">
                <label className="label">{t("admin.reasonOptional")}</label>
                <input className="input" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setBanTarget(null)} className="btn-ghost">{t("common.cancel")}</button>
                <button
                  onClick={() => {
                    ban.mutate(
                      { id: banTarget.id, days: banDays, reason: banReason },
                      { onSuccess: () => { setBanTarget(null); setBanReason(""); } }
                    );
                  }}
                  className="btn-primary"
                >
                  {t("admin.banUser")}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
