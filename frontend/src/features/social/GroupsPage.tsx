import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/primitives";
import { useGroups } from "./hooks";

export function GroupsPage() {
  const { t } = useTranslation();
  const { data: groups = [], isLoading, toggle, create } = useGroups();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("pages.groups")}</h1>
          <p className="text-sm text-muted">{t("pages.groupsSubtitle")}</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          {t("groups.newGroup")}
        </button>
      </header>

      {showForm && (
        <Card className="space-y-3">
          <input className="input" placeholder={t("groups.name")} value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="input min-h-16" placeholder={t("groups.about")} value={description} onChange={(e) => setDescription(e.target.value)} />
          <button
            className="btn-primary"
            disabled={!name.trim() || create.isPending}
            onClick={() =>
              create.mutate(
                { name, description },
                { onSuccess: () => { setName(""); setDescription(""); setShowForm(false); } }
              )
            }
          >
            {t("groups.create")}
          </button>
        </Card>
      )}

      {isLoading && <p className="text-muted">{t("groups.loading")}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.id} className="flex flex-col">
            <Link to={`/dashboard/groups/${g.id}`} className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-xl">👥</span>
              <div>
                <h3 className="font-semibold">{g.name}</h3>
                <p className="text-xs text-muted">
                  {t("groups.members", { count: g.member_count })}
                  {g.joined && <span className="ml-2 text-success">· {t("groups.openChat")}</span>}
                </p>
              </div>
            </Link>
            <p className="mt-3 flex-1 text-sm text-muted">{g.description}</p>
            <div className="mt-4 flex gap-2">
              <Link to={`/dashboard/groups/${g.id}`} className="btn-ghost flex-1">
                {g.joined ? t("groups.openChat") : t("groups.viewGroup")}
              </Link>
              <button
                onClick={() => toggle.mutate({ id: g.id, join: !g.joined })}
                className={g.joined ? "btn-ghost" : "btn-primary"}
                disabled={toggle.isPending}
              >
                {g.joined ? t("groups.leaveGroup") : t("groups.joinGroup")}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
