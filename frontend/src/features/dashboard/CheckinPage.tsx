import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/primitives";

const MOOD_KEYS = ["great", "good", "okay", "tired", "bad"] as const;

export function CheckinPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today,
    weight_kg: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
    water_ml: "",
    sleep_hours: "",
    workout_completed: false,
    mood: "good",
    energy_level: 7,
    notes: "",
  });
  const [saved, setSaved] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { ...form };
      // Strip empty numeric strings → undefined.
      for (const k of ["weight_kg", "calories", "protein_g", "carbs_g", "fat_g", "water_ml", "sleep_hours"]) {
        payload[k] = form[k as keyof typeof form] === "" ? null : Number(form[k as keyof typeof form]);
      }
      const { data } = await api.post("/fitness/checkins/", payload);
      return data;
    },
    onSuccess: (data) => {
      setSaved(data.daily_score);
      qc.invalidateQueries({ queryKey: ["checkins"] });
      qc.invalidateQueries({ queryKey: ["streak"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const num = (k: keyof typeof form, label: string, unit?: string, step = "1") => (
    <div>
      <label className="label">
        {label} {unit && <span className="lowercase">({unit})</span>}
      </label>
      <input
        type="number"
        step={step}
        className="input"
        value={form[k] as string}
        onChange={(e) => set(k, e.target.value)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("checkin.title")}</h1>
        <p className="text-sm text-muted">{t("checkin.subtitle")}</p>
      </header>

      {saved != null && (
        <Card className="border-success/40 bg-success/10">
          <p className="font-semibold text-success">{t("checkin.saved", { score: saved })}</p>
        </Card>
      )}

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {num("weight_kg", t("checkin.weight"), t("units.kg"), "0.1")}
            {num("calories", t("checkin.calories"), t("units.kcal"))}
            {num("water_ml", t("checkin.water"), t("units.ml"))}
            {num("protein_g", t("checkin.protein"), t("units.g"))}
            {num("carbs_g", t("checkin.carbs"), t("units.g"))}
            {num("fat_g", t("checkin.fat"), t("units.g"))}
            {num("sleep_hours", t("checkin.sleep"), t("units.h"), "0.5")}
          </div>

          <div>
            <label className="label">{t("checkin.mood")}</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_KEYS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set("mood", val)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    form.mood === val ? "border-accent bg-accent/15" : "border-border text-muted"
                  }`}
                >
                  {t(`checkin.moods.${val}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">{t("checkin.energyLevel")}: {form.energy_level}/10</label>
            <input
              type="range"
              min={1}
              max={10}
              value={form.energy_level}
              onChange={(e) => set("energy_level", Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.workout_completed}
              onChange={(e) => set("workout_completed", e.target.checked)}
              className="h-5 w-5 accent-[var(--accent)]"
            />
            <span className="text-sm">{t("checkin.completedWorkout")}</span>
          </label>

          <div>
            <label className="label">{t("checkin.notes")}</label>
            <textarea
              className="input min-h-20"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {mutation.isError && <p className="text-sm text-danger">{t("checkin.error")}</p>}

          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? t("checkin.saving") : t("checkin.saveCheckin")}
          </button>
        </form>
      </Card>
    </div>
  );
}
