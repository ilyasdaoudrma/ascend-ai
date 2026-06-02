import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Card, ProgressBar } from "@/components/ui/primitives";

interface Meal {
  id: number;
  meal_type: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export function NutritionPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const profile = useAuthStore((s) => s.user?.profile);
  const today = new Date().toISOString().slice(0, 10);

  const { data: meals = [] } = useQuery({
    queryKey: ["meals", today],
    queryFn: async () => {
      const { data } = await api.get<Meal[]>("/fitness/meals/today/");
      return data;
    },
  });

  const [form, setForm] = useState({
    meal_type: "breakfast",
    name: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });

  const add = useMutation({
    mutationFn: async () => {
      await api.post("/fitness/meals/", {
        date: today,
        meal_type: form.meal_type,
        name: form.name,
        calories: Number(form.calories || 0),
        protein_g: Number(form.protein_g || 0),
        carbs_g: Number(form.carbs_g || 0),
        fat_g: Number(form.fat_g || 0),
      });
    },
    onSuccess: () => {
      setForm({ ...form, name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });
      qc.invalidateQueries({ queryKey: ["meals", today] });
    },
  });

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein_g,
      carbs: acc.carbs + m.carbs_g,
      fat: acc.fat + m.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{t("nutrition.title")}</h1>
        <p className="text-sm text-muted">{t("nutrition.subtitle")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <Macro label={t("nutrition.calories")} value={totals.calories} target={profile?.recommended_calories} color="#7c5cff" />
        <Macro label={t("nutrition.protein")} value={totals.protein} target={profile?.protein_target_g} color="#22d3ee" unit="g" />
        <Macro label={t("nutrition.carbs")} value={totals.carbs} target={profile?.carbs_target_g} color="#34d399" unit="g" />
        <Macro label={t("nutrition.fat")} value={totals.fat} target={profile?.fat_target_g} color="#fbbf24" unit="g" />
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">{t("nutrition.addMeal")}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.name) add.mutate();
          }}
          className="grid gap-3 sm:grid-cols-6"
        >
          <select
            className="input sm:col-span-2"
            value={form.meal_type}
            onChange={(e) => setForm({ ...form, meal_type: e.target.value })}
          >
            {MEAL_TYPES.map((mt) => (
              <option key={mt} value={mt}>
                {t(`nutrition.mealTypes.${mt}`)}
              </option>
            ))}
          </select>
          <input
            className="input sm:col-span-4"
            placeholder={t("nutrition.mealName")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input className="input" placeholder={t("units.kcal")} value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          <input className="input" placeholder={`P (${t("units.g")})`} value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} />
          <input className="input" placeholder={`C (${t("units.g")})`} value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} />
          <input className="input" placeholder={`F (${t("units.g")})`} value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} />
          <button className="btn-primary sm:col-span-2" disabled={add.isPending}>{t("nutrition.addMealBtn")}</button>
        </form>
      </Card>

      <div className="space-y-2">
        {meals.map((m) => (
          <Card key={m.id} className="flex items-center justify-between py-4">
            <div>
              <span className="chip mr-2">{t(`nutrition.mealTypes.${m.meal_type}`)}</span>
              <span className="font-medium">{m.name}</span>
            </div>
            <span className="text-sm text-muted">
              {m.calories} {t("units.kcal")} · {m.protein_g}P {m.carbs_g}C {m.fat_g}F
            </span>
          </Card>
        ))}
        {meals.length === 0 && <p className="text-sm text-muted">{t("nutrition.noMeals")}</p>}
      </div>
    </div>
  );
}

function Macro({
  label,
  value,
  target,
  color,
  unit = "",
}: {
  label: string;
  value: number;
  target: number | null | undefined;
  color: string;
  unit?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold">
        {Math.round(value)}
        {unit}
        <span className="text-sm font-normal text-muted">
          {" "}/ {target ? Math.round(target) : "—"}
          {unit}
        </span>
      </p>
      <div className="mt-3">
        <ProgressBar value={value} max={target ?? 100} color={color} />
      </div>
    </Card>
  );
}
