import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/format";
import { useNotifications, useMarkAllRead } from "./hooks";

const ICON: Record<string, string> = {
  follow: "👤",
  like: "❤️",
  comment: "💬",
  friend: "🤝",
  challenge: "🏁",
};

export function NotificationsPage() {
  const { t } = useTranslation();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAll = useMarkAllRead();

  // Mark everything read once the page is opened.
  useEffect(() => {
    if (notifications.some((n) => !n.is_read)) markAll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("pages.notifications")}</h1>
        <p className="text-sm text-muted">{t("pages.notificationsSubtitle")}</p>
      </header>

      {isLoading && <p className="text-muted">Loading…</p>}

      <div className="space-y-2">
        {notifications.map((n) => {
          const body = (
            <Card
              className={`flex items-center gap-3 py-4 ${
                !n.is_read ? "ring-1 ring-accent/40" : ""
              }`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-lg">
                {ICON[n.kind] ?? "🔔"}
              </span>
              <div className="flex-1">
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-muted">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
            </Card>
          );
          return n.link ? (
            <Link key={n.id} to={n.link}>
              {body}
            </Link>
          ) : (
            <div key={n.id}>{body}</div>
          );
        })}
        {!isLoading && notifications.length === 0 && (
          <p className="text-sm text-muted">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
