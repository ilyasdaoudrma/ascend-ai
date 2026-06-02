import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/primitives";
import { Avatar } from "./Avatar";
import { useLeaderboard } from "./hooks";

const CATEGORIES = [
  { key: "xp", label: "xp", unit: "unitXp" },
  { key: "streak", label: "longestStreak", unit: "unitDays" },
  { key: "workouts", label: "totalWorkouts", unit: "unitWorkouts" },
] as const;

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardPage() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<"xp" | "streak" | "workouts">("xp");
  const { data: entries = [], isLoading } = useLeaderboard(category);
  const unit = t(`leaderboard.${CATEGORIES.find((c) => c.key === category)?.unit ?? "unitXp"}`);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("pages.leaderboard")}</h1>
        <p className="text-sm text-muted">{t("pages.leaderboardSubtitle")}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              category === c.key ? "border-accent bg-accent/15 text-text" : "border-border text-muted"
            }`}
          >
            {t(`leaderboard.${c.label}`)}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted">{t("common.loading")}</p>}

      <div className="space-y-2">
        {entries.map((e) => (
          <Card
            key={e.user.id}
            className={`flex items-center gap-4 py-4 ${e.is_me ? "ring-1 ring-accent/50" : ""}`}
          >
            <span className="w-8 text-center text-lg font-bold">
              {e.rank <= 3 ? MEDALS[e.rank - 1] : e.rank}
            </span>
            <Avatar user={e.user} size={40} />
            <div className="flex-1">
              <p className="font-medium">
                {e.user.full_name}
                {e.is_me && <span className="ml-2 chip">{t("common.you")}</span>}
              </p>
              <p className="text-xs text-muted">{t("leaderboard.levelN", { level: e.level })}</p>
            </div>
            <span className="text-lg font-bold text-gradient">
              {Math.round(e.value).toLocaleString()}
              <span className="ml-1 text-xs font-normal text-muted">{unit}</span>
            </span>
          </Card>
        ))}
        {!isLoading && entries.length === 0 && (
          <p className="text-sm text-muted">{t("leaderboard.noEntries")}</p>
        )}
      </div>
    </div>
  );
}
