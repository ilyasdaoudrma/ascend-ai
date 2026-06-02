import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { Card, ProgressBar } from "@/components/ui/primitives";
import { useGoals } from "./hooks";

export function GoalsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: goals = [] } = useGoals();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("kg");

  const create = useMutation({
    mutationFn: async () => {
      await api.post("/fitness/goals/", {
        goal_type: "custom",
        title,
        target_value: Number(target),
        current_value: 0,
        unit,
      });
    },
    onSuccess: () => {
      setTitle("");
      setTarget("");
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("goals.title")}</h1>
        <p className="text-sm text-muted">{t("goals.subtitle")}</p>
      </header>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title && target) create.mutate();
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex-1">
            <label className="label">{t("nav.goals")}</label>
            <input className="input" placeholder={t("goals.placeholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="w-28">
            <label className="label">{t("goals.target")}</label>
            <input type="number" className="input" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <div className="w-24">
            <label className="label">{t("goals.unit")}</label>
            <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={create.isPending}>{t("common.add")}</button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map((g) => (
          <Card key={g.id}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{g.title}</h3>
              {g.is_completed && <span className="chip text-success">{t("goals.done")}</span>}
            </div>
            <p className="mt-1 text-sm text-muted">
              {g.current_value} / {g.target_value} {g.unit}
            </p>
            <div className="mt-3">
              <ProgressBar value={g.progress_pct} />
            </div>
            <p className="mt-1 text-right text-xs text-muted">{g.progress_pct}%</p>
          </Card>
        ))}
        {goals.length === 0 && <p className="text-sm text-muted">{t("goals.noGoals")}</p>}
      </div>
    </div>
  );
}
