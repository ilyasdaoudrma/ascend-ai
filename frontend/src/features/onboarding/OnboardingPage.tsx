import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const GOAL_KEYS = ["weight_loss", "fat_loss", "lean_bulk", "muscle_gain", "maintenance", "recomposition"];
const ACTIVITY_KEYS = ["sedentary", "light", "moderate", "active", "athlete"];
const EXPERIENCE_KEYS = ["beginner", "intermediate", "advanced"];
const DIET_KEYS = ["omnivore", "vegetarian", "vegan", "keto", "halal"];
const STEP_KEYS = ["about", "body", "goal", "training"] as const;

interface FormState {
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  experience: string;
  goal: string;
  weekly_training_days: number;
  gym_access: boolean;
  sleep_average_hours: number;
  dietary_preference: string;
}

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    gender: "male",
    age: 25,
    height_cm: 175,
    weight_kg: 75,
    activity_level: "moderate",
    experience: "beginner",
    goal: "fat_loss",
    weekly_training_days: 4,
    gym_access: true,
    sleep_average_hours: 7,
    dietary_preference: "omnivore",
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setSaving(true);
    try {
      await api.post("/auth/onboarding/", form);
      await fetchMe();
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const Pill = ({
    options,
    value,
    onChange,
  }: {
    options: string[][];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(([val, label]) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            value === val
              ? "border-accent bg-accent/15 text-text"
              : "border-border text-muted hover:text-text"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <div className="mb-3 flex justify-between text-xs text-muted">
          <span>{t("onboarding.stepOf", { current: step + 1, total: STEP_KEYS.length })}</span>
          <span>{t(`onboarding.steps.${STEP_KEYS[step]}`)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-cyan-400 transition-[width] duration-500 ease-smooth"
            style={{ width: `${((step + 1) / STEP_KEYS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-bold">{t(`onboarding.steps.${STEP_KEYS[step]}`)}</h2>

        {step === 0 && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="label">{t("onboarding.gender")}</label>
              <Pill
                options={[["male", t("onboarding.genders.male")], ["female", t("onboarding.genders.female")], ["other", t("onboarding.genders.other")]]}
                value={form.gender}
                onChange={(v) => set("gender", v)}
              />
            </div>
            <div>
              <label className="label">{t("onboarding.age")}</label>
              <input
                type="number"
                className="input"
                value={form.age}
                onChange={(e) => set("age", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">{t("onboarding.activityLevel")}</label>
              <Pill options={ACTIVITY_KEYS.map((k) => [k, t(`onboarding.activities.${k}`)])} value={form.activity_level} onChange={(v) => set("activity_level", v)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="label">{t("onboarding.height")}</label>
              <input type="number" className="input" value={form.height_cm} onChange={(e) => set("height_cm", Number(e.target.value))} />
            </div>
            <div>
              <label className="label">{t("onboarding.weight")}</label>
              <input type="number" className="input" value={form.weight_kg} onChange={(e) => set("weight_kg", Number(e.target.value))} />
            </div>
            <div>
              <label className="label">{t("onboarding.avgSleep")}</label>
              <input type="number" step="0.5" className="input" value={form.sleep_average_hours} onChange={(e) => set("sleep_average_hours", Number(e.target.value))} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="label">{t("onboarding.primaryGoal")}</label>
              <Pill options={GOAL_KEYS.map((k) => [k, t(`onboarding.goals.${k}`)])} value={form.goal} onChange={(v) => set("goal", v)} />
            </div>
            <div>
              <label className="label">{t("onboarding.experience")}</label>
              <Pill options={EXPERIENCE_KEYS.map((k) => [k, t(`onboarding.experiences.${k}`)])} value={form.experience} onChange={(v) => set("experience", v)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="label">{t("onboarding.trainingDays")}: {form.weekly_training_days}</label>
              <input
                type="range"
                min={1}
                max={7}
                value={form.weekly_training_days}
                onChange={(e) => set("weekly_training_days", Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </div>
            <div>
              <label className="label">{t("onboarding.gymAccess")}</label>
              <Pill
                options={[["true", t("onboarding.yes")], ["false", t("onboarding.no")]]}
                value={String(form.gym_access)}
                onChange={(v) => set("gym_access", v === "true")}
              />
            </div>
            <div>
              <label className="label">{t("onboarding.dietary")}</label>
              <Pill
                options={DIET_KEYS.map((k) => [k, t(`onboarding.diets.${k}`)])}
                value={form.dietary_preference}
                onChange={(v) => set("dietary_preference", v)}
              />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button onClick={back} className="btn-ghost" disabled={step === 0}>
            {t("common.back")}
          </button>
          {step < STEP_KEYS.length - 1 ? (
            <button onClick={next} className="btn-primary">
              {t("common.continue")}
            </button>
          ) : (
            <button onClick={finish} className="btn-primary" disabled={saving}>
              {saving ? t("onboarding.calculating") : t("onboarding.finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
