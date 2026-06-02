import { useTranslation } from "react-i18next";
import { Card, ProgressBar } from "@/components/ui/primitives";
import { useChallenges } from "./hooks";

const ICONS: Record<string, string> = {
  flame: "🔥",
  muscle: "💪",
  droplet: "💧",
  sun: "☀️",
  trophy: "🏆",
};

export function ChallengesPage() {
  const { t } = useTranslation();
  const { data: challenges = [], isLoading, join } = useChallenges();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("pages.challenges")}</h1>
        <p className="text-sm text-muted">{t("pages.challengesSubtitle")}</p>
      </header>

      {isLoading && <p className="text-muted">Loading…</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {challenges.map((c) => (
          <Card key={c.id} className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-2xl">
                {ICONS[c.icon] ?? "🏁"}
              </span>
              <div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-xs text-muted">{t("challenges.participants", { count: c.participant_count })}</p>
              </div>
            </div>
            <p className="mt-3 flex-1 text-sm text-muted">{c.description}</p>

            {c.joined ? (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted">
                  <span>{t("challenges.yourProgress")}</span>
                  <span>
                    {Math.round(c.my_progress)}/{c.target_value} {c.unit}
                  </span>
                </div>
                <ProgressBar value={c.my_progress} max={c.target_value} />
              </div>
            ) : (
              <button
                onClick={() => join.mutate(c.id)}
                className="btn-primary mt-4"
                disabled={join.isPending}
              >
                {t("challenges.joinChallenge")}
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
