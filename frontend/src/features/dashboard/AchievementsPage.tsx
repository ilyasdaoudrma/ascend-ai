import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/primitives";

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

interface GamificationProfile {
  xp: number;
  level: number;
  xp_into_level: number;
  xp_for_next_level: number;
}

export function AchievementsPage() {
  const { t } = useTranslation();
  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data } = await api.get<Achievement[] | { results: Achievement[] }>(
        "/gamification/achievements/"
      );
      return Array.isArray(data) ? data : data.results;
    },
  });

  const { data: unlocked = [] } = useQuery({
    queryKey: ["achievements-me"],
    queryFn: async () => {
      const { data } = await api.get<{ achievement: Achievement }[]>(
        "/gamification/achievements/me/"
      );
      return data.map((u) => u.achievement.code);
    },
  });

  const { data: gp } = useQuery({
    queryKey: ["gamification-profile"],
    queryFn: async () => {
      const { data } = await api.get<GamificationProfile[] | GamificationProfile>(
        "/gamification/profile/"
      );
      return Array.isArray(data) ? data[0] : data;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("achievements.title")}</h1>
        <p className="text-sm text-muted">{t("achievements.subtitle")}</p>
      </header>

      {gp && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">{t("achievements.level")}</p>
              <p className="text-4xl font-extrabold text-gradient">{gp.level}</p>
            </div>
            <div className="text-end">
              <p className="text-sm text-muted">{t("achievements.xpTotal", { xp: gp.xp })}</p>
              <p className="text-xs text-muted">
                {t("achievements.toNext", { current: gp.xp_into_level, total: gp.xp_for_next_level })}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-cyan-400"
              style={{ width: `${(gp.xp_into_level / gp.xp_for_next_level) * 100}%` }}
            />
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const isUnlocked = unlocked.includes(a.code);
          return (
            <Card key={a.id} className={isUnlocked ? "ring-1 ring-accent/40" : "opacity-60"}>
              <div className="flex items-start gap-3">
                <span className="text-3xl">{isUnlocked ? "🏆" : "🔒"}</span>
                <div>
                  <h3 className="font-semibold">{a.name}</h3>
                  <p className="text-xs text-muted">{a.description}</p>
                  <p className="mt-2 text-xs font-semibold text-accent">+{a.xp_reward} XP</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
