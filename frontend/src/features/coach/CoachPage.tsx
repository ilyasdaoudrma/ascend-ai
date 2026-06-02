import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/primitives";
import { useAuthStore } from "@/stores/authStore";
import type { ChatMessage } from "@/lib/types";
import { useCoachChat, useSubscribe } from "./hooks";

export function CoachPage() {
  const { t } = useTranslation();
  const { user, fetchMe } = useAuthStore();
  // Pro subscribers and the site admin (staff) can use the chat.
  const canUse = !!user?.profile?.is_premium || !!user?.is_staff;
  const chat = useCoachChat();
  const subscribe = useSubscribe();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, chat.isPending]);

  const suggestions = [
    t("coach.suggest1"),
    t("coach.suggest2"),
    t("coach.suggest3"),
  ];

  const sendMessage = (text: string) => {
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setDraft("");
    chat.mutate(
      { message: text, history: messages },
      {
        onSuccess: (data) =>
          setMessages((m) => [...m, { role: "coach", content: data.reply }]),
        onError: () =>
          setMessages((m) => [...m, { role: "coach", content: t("coach.error") }]),
      }
    );
  };

  // ---- Upsell (non-premium, non-admin) ----
  if (!canUse) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold">🧠 {t("coach.title")}</h1>
          <p className="text-sm text-muted">{t("coach.subtitle")}</p>
        </header>

        <Card className="relative overflow-hidden text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{ background: "radial-gradient(30rem 16rem at 50% 0%, var(--accent-soft), transparent 70%)" }}
          />
          <div className="relative py-8">
            <span className="chip mb-4">✦ {t("coach.proBadge")}</span>
            <h2 className="text-2xl font-bold">{t("coach.upsellTitle")}</h2>
            <p className="mx-auto mt-3 max-w-md text-muted">{t("coach.upsellBody")}</p>
            <ul className="mx-auto mt-5 max-w-sm space-y-2 text-start text-sm text-muted">
              <li className="flex gap-2"><span className="text-accent">✓</span> {t("coach.perk1")}</li>
              <li className="flex gap-2"><span className="text-accent">✓</span> {t("coach.perk2")}</li>
              <li className="flex gap-2"><span className="text-accent">✓</span> {t("coach.perk3")}</li>
            </ul>
            <button
              onClick={() => subscribe.mutate(undefined, { onSuccess: () => fetchMe() })}
              className="btn-primary mt-7 px-7 py-3"
              disabled={subscribe.isPending}
            >
              {subscribe.isPending ? t("coach.activating") : t("coach.upgradeBtn")}
            </button>
            <p className="mt-3 text-xs text-muted">{t("coach.demoNote")}</p>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Chat (premium) ----
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧠 {t("coach.title")}</h1>
          <p className="text-sm text-muted">{t("coach.subtitle")}</p>
        </div>
        <span className="chip text-accent">✦ {t("coach.proBadge")}</span>
      </header>

      <Card className="flex h-[68vh] flex-col p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="grid h-full place-items-center">
              <div className="max-w-md text-center">
                <div className="text-4xl">👋</div>
                <p className="mt-3 text-muted">{t("coach.greeting", { name: user?.full_name?.split(" ")[0] })}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => sendMessage(s)} className="chip hover:text-text">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-accent text-white" : "bg-white/8 text-text"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {chat.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white/8 px-4 py-2.5 text-sm text-muted">
                {t("coach.thinking")}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim() && !chat.isPending) sendMessage(draft.trim());
          }}
          className="flex gap-2 border-t border-border p-3"
        >
          <input
            className="input"
            placeholder={t("coach.placeholder")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn-primary px-5" disabled={chat.isPending || !draft.trim()}>
            {t("common.send")}
          </button>
        </form>
      </Card>
    </div>
  );
}
