import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/layout/Navbar";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { ThreeHero } from "./ThreeHero";

const FEATURE_ICONS = ["🏋️", "🍽️", "🧠", "📈", "🔥", "🤝"];
const STEP_NUMS = ["01", "02", "03"];
const PLAN_HIGHLIGHT = [false, true, false];

// Brand SVG paths (Simple Icons) for the creator links.
const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/ilyasdaoudrma",
    path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/ilyas-daoud-el-asmi-0a531039b",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/ig_yas10/",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
];

interface TitleText { title: string; text: string; }
interface Plan { name: string; price: string; cta: string; features: string[]; }
interface Faq { q: string; a: string; }

export function LandingPage() {
  const { t } = useTranslation();
  const features = t("landingSections.features", { returnObjects: true }) as TitleText[];
  const steps = t("landingSections.steps", { returnObjects: true }) as TitleText[];
  const plans = t("landingSections.plans", { returnObjects: true }) as Plan[];
  const faqs = t("landingSections.faqs", { returnObjects: true }) as Faq[];
  const coachBullets = t("landingSections.coachBullets", { returnObjects: true }) as string[];
  return (
    <div className="relative overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative flex min-h-screen items-center">
        <ThreeHero />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <Reveal>
              <span className="chip mb-6">{t("landing.heroBadge")}</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="text-5xl font-extrabold leading-[1.05] md:text-7xl">
                {t("landing.heroTitle1")}
                <br />
                <span className="text-gradient">{t("landing.heroTitle2")}</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl text-lg text-muted">{t("landing.heroSubtitle")}</p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register" className="btn-primary px-7 py-3 text-base">
                  {t("landing.heroCta")}
                </Link>
                <a href="#features" className="btn-ghost px-7 py-3 text-base">
                  {t("landing.heroExplore")}
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <div className="mt-14 flex gap-10">
                <div>
                  <p className="text-3xl font-bold">
                    <CountUp to={50000} suffix="+" />
                  </p>
                  <p className="text-sm text-muted">{t("landing.statWorkouts")}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    <CountUp to={98} suffix="%" />
                  </p>
                  <p className="text-sm text-muted">{t("landing.statTargets")}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    <CountUp to={4.9} decimals={1} />
                  </p>
                  <p className="text-sm text-muted">{t("landing.statRating")}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal>
          <p className="chip mb-4">{t("landingSections.featuresEyebrow")}</p>
          <h2 className="max-w-2xl text-4xl font-bold md:text-5xl">
            {t("landingSections.featuresTitle")}
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <div className="card h-full p-7 transition-transform duration-500 ease-smooth hover:-translate-y-1.5">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-2xl">
                  {FEATURE_ICONS[i]}
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-border bg-surface/40 py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="text-4xl font-bold md:text-5xl">{t("landingSections.howTitle")}</h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="card h-full p-8">
                  <span className="text-5xl font-extrabold text-gradient">{STEP_NUMS[i]}</span>
                  <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AI COACH */}
      <section id="coach" className="mx-auto max-w-6xl px-6 py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="chip mb-4">{t("landingSections.coachEyebrow")}</p>
              <h2 className="text-4xl font-bold md:text-5xl">
                {t("landingSections.coachTitle")}
              </h2>
              <p className="mt-5 text-muted">{t("landingSections.coachText")}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {coachBullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="text-accent">▸</span>
                    <span className="text-muted">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card space-y-4 p-7">
              {[
                { tag: "HIGH", color: "var(--danger)", title: "Increase protein today", body: "You hit 120g vs a 176g target." },
                { tag: "MED", color: "var(--warning)", title: "Stay on track with training", body: "3/4 sessions done this week." },
                { tag: "LOW", color: "var(--success)", title: "Hydrate more", body: "Aim for 2.9L of water today." },
              ].map((r) => (
                <div key={r.title} className="rounded-xl border border-border bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.title}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: r.color, color: "#0a0a0f" }}
                    >
                      {r.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{r.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal>
          <h2 className="text-center text-4xl font-bold md:text-5xl">{t("landingSections.pricingTitle")}</h2>
          <p className="mt-3 text-center text-muted">{t("landingSections.pricingSubtitle")}</p>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => {
            const highlight = PLAN_HIGHLIGHT[i];
            return (
              <Reveal key={p.name} delay={i * 0.07}>
                <div className={`card h-full p-8 ${highlight ? "ring-2 ring-accent shadow-glow" : ""}`}>
                  {highlight && <span className="chip mb-4">{t("landingSections.mostPopular")}</span>}
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-2 text-4xl font-extrabold">
                    {p.price}
                    {i > 0 && <span className="text-base text-muted">{t("landingSections.perMonth")}</span>}
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-muted">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-accent">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className={`mt-7 w-full ${highlight ? "btn-primary" : "btn-ghost"}`}>
                    {p.cta}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-28">
        <Reveal>
          <h2 className="text-center text-4xl font-bold md:text-5xl">{t("landingSections.faqTitle")}</h2>
        </Reveal>
        <div className="mt-12 space-y-4">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <details className="card group p-6">
                <summary className="cursor-pointer list-none text-lg font-semibold marker:hidden">
                  <span className="flex items-center justify-between">
                    {f.q}
                    <span className="text-accent transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <Reveal>
          <div className="card relative overflow-hidden p-12 text-center md:p-20">
            <div
              className="pointer-events-none absolute inset-0 -z-0 opacity-60"
              style={{
                background:
                  "radial-gradient(40rem 20rem at 50% 0%, var(--accent-soft), transparent 70%)",
              }}
            />
            <h2 className="relative text-4xl font-bold md:text-6xl">{t("landingSections.ctaTitle")}</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-muted">{t("landingSections.ctaSubtitle")}</p>
            <Link to="/register" className="btn-primary relative mt-8 px-8 py-3 text-base">
              {t("landingSections.ctaButton")}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* CREATOR */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <Reveal>
          <div className="card flex flex-col items-center gap-6 p-10 text-center sm:flex-row sm:text-start">
            <img
              src="/ilyas.png"
              alt="Ilyas Daoud El Asmi"
              className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-2 ring-accent/40"
            />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-muted">Made by</p>
              <h3 className="text-2xl font-bold">Ilyas Daoud El Asmi</h3>
              <p className="mt-2 max-w-xl text-sm text-muted">
                Full-stack developer who loves turning ideas into polished, production-grade
                products. I built Ascend AI end-to-end — from the Django REST API and AI
                coaching engine to the animated React interface.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted transition-colors duration-200 hover:border-accent hover:text-text"
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
                <a
                  href="https://wa.me/212721288758"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost px-4 py-2 text-sm"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted md:flex-row">
          <span className="flex items-center gap-2 font-bold">
            <img src="/logo.png" alt="Ascend AI" className="h-7 w-7 rounded-lg" />
            <span className="text-gradient">Ascend AI</span>
          </span>
          <p>{t("landingSections.footerRights", { year: new Date().getFullYear() })}</p>
          <div className="flex gap-5">
            <a href="/#features" className="hover:text-text">{t("landing.features")}</a>
            <a href="/#pricing" className="hover:text-text">{t("landing.pricing")}</a>
            <Link to="/login" className="hover:text-text">{t("landing.login")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
