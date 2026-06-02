import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { fmtDate } from "@/lib/format";
import { useWorkouts, useSessions } from "./hooks";
import type { Workout, WorkoutSession } from "@/lib/types";

export function WorkoutsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: workouts = [], isLoading } = useWorkouts();
  const { data: history = [] } = useSessions("completed");
  const [active, setActive] = useState<Workout | null>(null);

  const startSession = useMutation({
    mutationFn: async (workoutId: number) => {
      const { data } = await api.post<WorkoutSession>("/fitness/sessions/start/", {
        workout: workoutId,
      });
      return data;
    },
    onSuccess: (session) => navigate(`/dashboard/session/${session.id}`),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("workouts.title")}</h1>
        <p className="text-sm text-muted">{t("workouts.subtitle")}</p>
      </header>

      {isLoading && <p className="text-muted">{t("workouts.loading")}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {workouts.map((w) => (
          <Card key={w.id} className="transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="chip">{t(`workouts.categories.${w.category}`)}</span>
              <span className="text-xs text-muted">{w.estimated_minutes} {t("workouts.min")} · {w.level}</span>
            </div>
            <h3 className="mt-3 text-xl font-semibold">{w.name}</h3>
            <p className="mt-1 text-sm text-muted">{t("workouts.exercises", { count: w.items.length })}</p>
            <button onClick={() => setActive(w)} className="btn-ghost mt-4">
              {t("workouts.viewSession")}
            </button>
          </Card>
        ))}
      </div>

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("workouts.recentSessions")}</h2>
          <div className="space-y-2">
            {history.slice(0, 8).map((s) => (
              <Card key={s.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-success/15 text-success">
                    ✓
                  </span>
                  <div>
                    <p className="text-sm font-medium">{fmtDate(s.started_at)}</p>
                    <p className="text-xs text-muted">
                      {t("workouts.setsCount", { count: s.set_logs.filter((l) => l.completed).length })} ·{" "}
                      {s.duration_minutes ?? 0} {t("workouts.min")}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted">
                  {Math.round(s.total_volume_kg).toLocaleString()} {t("workouts.minVolume")}
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}

      {active && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur"
          onClick={() => setActive(null)}
        >
          <Card
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto"
            // stop propagation so clicks inside don't close
          >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{active.name}</h2>
                  <p className="text-sm text-muted">
                    {t(`workouts.categories.${active.category}`)} · {active.estimated_minutes} {t("workouts.min")}
                  </p>
                </div>
                <button onClick={() => setActive(null)} className="text-muted hover:text-text">
                  ✕
                </button>
              </div>
              <div className="mt-5 space-y-2">
                {active.items.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/20 text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">{item.exercise.name}</span>
                    </div>
                    <span className="text-xs text-muted">
                      {item.sets} × {item.reps} · {item.rest_seconds}s rest
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="btn-primary mt-6 w-full"
                onClick={() => startSession.mutate(active.id)}
                disabled={startSession.isPending}
              >
                {startSession.isPending ? t("workouts.starting") : t("workouts.startWorkout")}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
