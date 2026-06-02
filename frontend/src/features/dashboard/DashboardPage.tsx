import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { Card, Stat, ProgressBar } from "@/components/ui/primitives";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { fmtDate, fmtKg } from "@/lib/format";
import { useCheckins, useRecommendations, useStreak } from "./hooks";

const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--danger)",
  medium: "var(--warning)",
  low: "var(--success)",
};

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const profile = user?.profile;
  const { data: checkins = [], isLoading } = useCheckins();
  const { data: streak = 0 } = useStreak();
  const { data: recs = [] } = useRecommendations();

  const latest = checkins[checkins.length - 1];
  const first = checkins[0];
  const weeklyChange =
    latest?.weight_kg && first?.weight_kg ? latest.weight_kg - first.weight_kg : null;

  const chartData = checkins.map((c) => ({
    date: fmtDate(c.date),
    weight: c.weight_kg,
    calories: c.calories,
    score: c.daily_score,
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{t("dashboard.welcomeBack")}</p>
          <h1 className="text-3xl font-bold">{user?.full_name?.split(" ")[0]} 👋</h1>
        </div>
        <div className="chip">🔥 {t("dashboard.streak", { days: streak })}</div>
      </header>

      {/* Today's overview */}
      <Reveal as="section" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Stat label={t("dashboard.calorieTarget")}
            value={<CountUp to={profile?.recommended_calories ?? 0} />}
            hint={t("dashboard.kcalPerDay")} />
        </Card>
        <Card>
          <Stat label={t("dashboard.proteinTarget")}
            value={<><CountUp to={profile?.protein_target_g ?? 0} />g</>}
            hint={t("dashboard.perDay")} />
        </Card>
        <Card>
          <Stat label={t("dashboard.waterTarget")}
            value={<><CountUp to={(profile?.water_target_ml ?? 0) / 1000} decimals={1} />L</>}
            hint={t("dashboard.perDay")} />
        </Card>
        <Card>
          <Stat label={t("dashboard.dailyScore")}
            value={<><CountUp to={latest?.daily_score ?? 0} />/100</>}
            hint={t("dashboard.latestCheckin")} />
        </Card>
      </Reveal>

      {/* Progress cards */}
      <Reveal as="section" delay={0.05} className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Stat label={t("dashboard.currentWeight")} value={fmtKg(latest?.weight_kg)} />
        </Card>
        <Card>
          <Stat label={t("dashboard.bmi")} value={profile?.bmi ?? "—"} hint={t("dashboard.bmiHint")} />
        </Card>
        <Card>
          <Stat label={t("dashboard.change14")}
            value={
              weeklyChange == null ? "—" : (
                <span className={weeklyChange < 0 ? "text-success" : "text-warning"}>
                  {weeklyChange > 0 ? "+" : ""}
                  {weeklyChange.toFixed(1)} kg
                </span>
              )
            } />
        </Card>
      </Reveal>

      {/* Charts */}
      <Reveal as="section" delay={0.05} className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-muted">{t("dashboard.weightEvolution")}</h3>
          {isLoading ? (
            <Skeleton />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,136,154,0.18)" />
                <XAxis dataKey="date" stroke="#8a8a9a" fontSize={11} />
                <YAxis stroke="#8a8a9a" fontSize={11} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="weight" stroke="#7c5cff" strokeWidth={2} fill="url(#wg)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-muted">{t("dashboard.caloriesConsumed")}</h3>
          {isLoading ? (
            <Skeleton />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,136,154,0.18)" />
                <XAxis dataKey="date" stroke="#8a8a9a" fontSize={11} />
                <YAxis stroke="#8a8a9a" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(136,136,154,0.1)" }} />
                <Bar dataKey="calories" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Reveal>

      {/* AI Coach */}
      <Reveal as="section" delay={0.05}>
        <h3 className="mb-4 text-lg font-semibold">🧠 {t("dashboard.coachTitle")}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {recs.map((r, i) => (
            <Card key={i} className="p-5 transition-transform duration-300 ease-smooth hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.title}</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{ background: PRIORITY_COLOR[r.priority], color: "#0a0a0f" }}>
                  {r.priority}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{r.message}</p>
            </Card>
          ))}
          {recs.length === 0 && <p className="text-sm text-muted">{t("dashboard.noRecs")}</p>}
        </div>
      </Reveal>

      {/* Macro targets */}
      {profile && (
        <Reveal as="section" delay={0.05}>
          <h3 className="mb-4 text-lg font-semibold">{t("dashboard.macroTargets")}</h3>
          <Card className="space-y-4">
            <MacroRow label={t("dashboard.protein")} value={profile.protein_target_g} unit="g" color="#7c5cff" max={profile.protein_target_g} />
            <MacroRow label={t("dashboard.carbs")} value={profile.carbs_target_g} unit="g" color="#22d3ee" max={profile.carbs_target_g} />
            <MacroRow label={t("dashboard.fat")} value={profile.fat_target_g} unit="g" color="#fbbf24" max={profile.fat_target_g} />
          </Card>
        </Reveal>
      )}
    </div>
  );
}

function MacroRow({
  label,
  value,
  unit,
  color,
  max,
}: {
  label: string;
  value: number | null;
  unit: string;
  color: string;
  max: number | null;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted">
          {value ?? "—"} {unit}
        </span>
      </div>
      <ProgressBar value={value ?? 0} max={max ?? 100} color={color} />
    </div>
  );
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "var(--text)",
};

function Skeleton() {
  return <div className="h-[220px] animate-pulse rounded-xl bg-white/5" />;
}
