import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/format";
import { Avatar, UserName } from "./Avatar";
import { useActivity } from "./hooks";

const VERB_ICON: Record<string, string> = {
  workout: "🏋️",
  achievement: "🏆",
  streak: "🔥",
  post: "💬",
  joined: "🏁",
};

export function ActivityPage() {
  const { t } = useTranslation();
  const { data: events = [], isLoading } = useActivity();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("pages.activity")}</h1>
        <p className="text-sm text-muted">{t("pages.activitySubtitle")}</p>
      </header>

      {isLoading && <p className="text-muted">Loading…</p>}

      <div className="relative space-y-3 before:absolute before:left-[27px] before:top-2 before:h-full before:w-px before:bg-border">
        {events.map((e) => (
          <Card key={e.id} className="relative flex items-center gap-3 py-4">
            <div className="relative">
              <Avatar user={e.actor} size={40} />
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-card text-[11px]">
                {VERB_ICON[e.verb] ?? "•"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <UserName user={e.actor} className="text-sm" />{" "}
                <span className="text-muted">{e.text.replace(e.actor.full_name, "").trim()}</span>
              </p>
              <p className="text-xs text-muted">{timeAgo(e.created_at)}</p>
            </div>
          </Card>
        ))}
        {!isLoading && events.length === 0 && (
          <p className="text-sm text-muted">{t("activity.empty")}</p>
        )}
      </div>
    </div>
  );
}
