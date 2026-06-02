import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Card, Stat } from "@/components/ui/primitives";
import { fmtDate } from "@/lib/format";
import { useCheckins } from "./hooks";

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  fontSize: "12px",
};

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { data: checkins = [], isLoading } = useCheckins();

  const data = checkins.map((c) => ({
    date: fmtDate(c.date),
    weight: c.weight_kg,
    calories: c.calories,
    sleep: c.sleep_hours,
    score: c.daily_score,
    workout: c.workout_completed ? 1 : 0,
  }));

  const totalWorkouts = checkins.filter((c) => c.workout_completed).length;
  const avgSleep =
    checkins.filter((c) => c.sleep_hours).reduce((a, c) => a + (c.sleep_hours ?? 0), 0) /
    Math.max(checkins.filter((c) => c.sleep_hours).length, 1);
  const avgScore =
    checkins.reduce((a, c) => a + c.daily_score, 0) / Math.max(checkins.length, 1);
  const consistencyPct = checkins.length
    ? (totalWorkouts / checkins.length) * 100
    : 0;

  if (isLoading) return <p className="text-muted">{t("analytics.loading")}</p>;

  if (checkins.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("analytics.title")}</h1>
        <p className="text-muted">{t("analytics.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{t("analytics.title")}</h1>
        <p className="text-sm text-muted">{t("analytics.subtitle", { count: checkins.length })}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <Card><Stat label={t("analytics.workouts")} value={totalWorkouts} hint={t("analytics.logged")} /></Card>
        <Card><Stat label={t("analytics.avgSleep")} value={`${avgSleep.toFixed(1)}${t("units.h")}`} /></Card>
        <Card><Stat label={t("analytics.avgScore")} value={`${avgScore.toFixed(0)}/100`} /></Card>
        <Card><Stat label={t("analytics.consistency")} value={`${consistencyPct.toFixed(0)}%`} hint={t("analytics.trainingDays")} /></Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("analytics.weightEvolution")}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="a-wg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="#8a8a9a" fontSize={11} />
            <YAxis stroke="#8a8a9a" fontSize={11} domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="weight" stroke="#7c5cff" strokeWidth={2} fill="url(#a-wg)" />
          </AreaChart>
        </ChartCard>

        <ChartCard title={t("analytics.calories")}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="#8a8a9a" fontSize={11} />
            <YAxis stroke="#8a8a9a" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="calories" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title={t("analytics.sleepQuality")}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="#8a8a9a" fontSize={11} />
            <YAxis stroke="#8a8a9a" fontSize={11} domain={[0, 10]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="sleep" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title={t("analytics.workoutConsistency")}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="#8a8a9a" fontSize={11} />
            <YAxis stroke="#8a8a9a" fontSize={11} domain={[0, 1]} ticks={[0, 1]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="workout" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.workout ? "#7c5cff" : "rgba(255,255,255,0.12)"} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title={t("analytics.dailyScore")} full>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="a-score" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="#8a8a9a" fontSize={11} />
            <YAxis stroke="#8a8a9a" fontSize={11} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="score" stroke="#fbbf24" strokeWidth={2} fill="url(#a-score)" />
          </AreaChart>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  full,
}: {
  title: string;
  children: React.ReactElement;
  full?: boolean;
}) {
  return (
    <Card className={`p-5 ${full ? "lg:col-span-2" : ""}`}>
      <h3 className="mb-4 text-sm font-semibold text-muted">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        {children}
      </ResponsiveContainer>
    </Card>
  );
}
