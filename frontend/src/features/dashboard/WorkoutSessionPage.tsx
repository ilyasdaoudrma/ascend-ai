import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import type { SetLog, WorkoutSession } from "@/lib/types";

export function WorkoutSessionPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [logs, setLogs] = useState<SetLog[]>([]);
  const [rewards, setRewards] = useState<WorkoutSession["rewards"] | null>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const { data } = await api.get<WorkoutSession>(`/fitness/sessions/${id}/`);
      return data;
    },
  });

  useEffect(() => {
    if (session) setLogs(session.set_logs);
  }, [session]);

  const updateLog = useMutation({
    mutationFn: async (log: Partial<SetLog> & { id: number }) => {
      const { id: logId, ...patch } = log;
      const { data } = await api.patch<SetLog>(`/fitness/setlogs/${logId}/`, patch);
      return data;
    },
  });

  const finish = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<WorkoutSession>(`/fitness/sessions/${id}/complete/`);
      return data;
    },
    onSuccess: (data) => {
      setRewards(data.rewards ?? null);
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["gamification-profile"] });
      qc.invalidateQueries({ queryKey: ["achievements-me"] });
    },
  });

  const patchLocal = (logId: number, patch: Partial<SetLog>) =>
    setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, ...patch } : l)));

  // Group set logs by exercise, preserving first-seen order.
  const grouped = useMemo(() => {
    const map = new Map<string, SetLog[]>();
    for (const log of logs) {
      const arr = map.get(log.exercise_name) ?? [];
      arr.push(log);
      map.set(log.exercise_name, arr);
    }
    return [...map.entries()];
  }, [logs]);

  const completedCount = logs.filter((l) => l.completed).length;
  const progress = logs.length ? (completedCount / logs.length) * 100 : 0;

  if (isLoading) return <p className="text-muted">{t("session.loading")}</p>;

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate("/dashboard/workouts")} className="text-sm text-muted hover:text-text">
            {t("session.back")}
          </button>
          <h1 className="mt-1 text-3xl font-bold">{t("session.title")}</h1>
        </div>
        <div className="chip">{t("session.setsDone", { done: completedCount, total: logs.length })}</div>
      </header>

      {/* Sticky progress */}
      <div className="sticky top-0 z-10 -mx-2 rounded-xl bg-bg/80 px-2 py-3 backdrop-blur">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-cyan-400 transition-[width] duration-500 ease-smooth"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {grouped.map(([exerciseName, sets]) => (
        <Card key={exerciseName}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{exerciseName}</h3>
            <span className="chip">{sets[0]?.exercise_muscle}</span>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-3 px-1 text-xs uppercase tracking-wide text-muted">
              <span>{t("session.set")}</span>
              <span>{t("session.weight")}</span>
              <span>{t("session.reps")}</span>
              <span className="text-right">{t("session.done")}</span>
            </div>
            {sets.map((log) => (
              <div
                key={log.id}
                className={`grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-3 rounded-xl border p-2.5 transition ${
                  log.completed ? "border-success/40 bg-success/10" : "border-border bg-white/5"
                }`}
              >
                <span className="text-center text-sm font-bold text-muted">{log.set_number}</span>
                <input
                  type="number"
                  className="input py-2"
                  value={log.weight_kg || ""}
                  onChange={(e) => patchLocal(log.id, { weight_kg: Number(e.target.value) })}
                  onBlur={(e) => updateLog.mutate({ id: log.id, weight_kg: Number(e.target.value) })}
                />
                <input
                  type="number"
                  className="input py-2"
                  value={log.reps || ""}
                  onChange={(e) => patchLocal(log.id, { reps: Number(e.target.value) })}
                  onBlur={(e) => updateLog.mutate({ id: log.id, reps: Number(e.target.value) })}
                />
                <button
                  onClick={() => {
                    const next = !log.completed;
                    patchLocal(log.id, { completed: next });
                    updateLog.mutate({ id: log.id, completed: next });
                  }}
                  className={`mx-auto grid h-8 w-8 place-items-center rounded-full border transition ${
                    log.completed
                      ? "border-success bg-success text-bg"
                      : "border-border text-muted hover:border-accent"
                  }`}
                  aria-label="Toggle set complete"
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Finish bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/90 p-4 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {t("session.setsLogged", { done: completedCount, total: logs.length })}
          </p>
          <button
            onClick={() => finish.mutate()}
            className="btn-primary"
            disabled={finish.isPending || finish.isSuccess}
          >
            {finish.isPending ? t("session.saving") : t("session.finish")}
          </button>
        </div>
      </div>

      {/* Rewards modal */}
      {finish.isSuccess && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur">
          <Card className="w-full max-w-sm text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="mt-3 text-2xl font-bold">{t("session.complete")}</h2>
            <p className="mt-2 text-muted">{t("session.xpEarned", { xp: rewards?.xp_awarded ?? 50 })}</p>
            {rewards?.unlocked && rewards.unlocked.length > 0 && (
              <div className="mt-4 space-y-2">
                {rewards.unlocked.map((a) => (
                  <div key={a.code} className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
                    🏆 {t("session.unlocked")} <span className="font-semibold">{a.name}</span> (+{a.xp_reward} XP)
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate("/dashboard")} className="btn-primary mt-6 w-full">
              {t("session.backToDashboard")}
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
