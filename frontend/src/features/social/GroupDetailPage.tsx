import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/format";
import { Avatar, UserName } from "./Avatar";
import { useGroup, useGroupMessages, useSendGroupMessage, useGroupJoin } from "./hooks";

export function GroupDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const groupId = id ? Number(id) : undefined;
  const { data: group, isLoading } = useGroup(groupId);
  const joined = !!group?.joined;
  const { data: messages = [] } = useGroupMessages(groupId, joined);
  const send = useSendGroupMessage(groupId);
  const join = useGroupJoin();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (isLoading || !group) {
    return <p className="text-muted">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/dashboard/groups" className="text-sm text-muted hover:text-text">
        {t("groups.backToGroups")}
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-2xl">👥</span>
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-sm text-muted">{t("groups.members", { count: group.member_count })}</p>
          </div>
        </div>
        <button
          onClick={() => join.mutate({ id: group.id, join: !joined })}
          className={joined ? "btn-ghost" : "btn-primary"}
          disabled={join.isPending}
        >
          {joined ? t("groups.leaveGroup") : t("groups.joinGroup")}
        </button>
      </header>

      {group.description && <p className="text-sm text-muted">{group.description}</p>}

      {/* Chat — gated behind membership (Instagram style) */}
      {joined ? (
        <Card className="flex h-[60vh] flex-col p-0">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="grid h-full place-items-center text-sm text-muted">
                {t("groups.noMessages")}
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.is_mine ? "flex-row-reverse" : ""}`}>
                {!m.is_mine && <Avatar user={m.sender} size={30} />}
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.is_mine ? "bg-accent text-white" : "bg-white/8 text-text"
                }`}>
                  {!m.is_mine && <UserName user={m.sender} className="mb-0.5 block text-xs opacity-80" />}
                  {m.content}
                  <span className="mt-1 block text-[10px] opacity-60">{timeAgo(m.created_at)}</span>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) {
                send.mutate(draft);
                setDraft("");
              }
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              className="input"
              placeholder={t("messages.typeMessage")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="btn-primary px-5" disabled={send.isPending}>{t("common.send")}</button>
          </form>
        </Card>
      ) : (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="text-4xl">🔒</span>
          <h3 className="text-lg font-semibold">{t("groups.chatLocked")}</h3>
          <p className="max-w-sm text-sm text-muted">{t("groups.chatLockedDesc")}</p>
          <button
            onClick={() => join.mutate({ id: group.id, join: true })}
            className="btn-primary mt-2"
            disabled={join.isPending}
          >
            {t("groups.joinToChat")}
          </button>
        </Card>
      )}
    </div>
  );
}
