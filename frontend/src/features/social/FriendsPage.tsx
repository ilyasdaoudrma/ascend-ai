import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/primitives";
import { Avatar, UserName } from "./Avatar";
import {
  useFriends,
  useFriendRequests,
  useFriendActions,
  useSuggestedUsers,
} from "./hooks";

export function FriendsPage() {
  const { t } = useTranslation();
  const { data: friends = [] } = useFriends();
  const { data: requests = [] } = useFriendRequests();
  const { data: suggestedRaw = [] } = useSuggestedUsers();
  const { sendRequest, accept, decline } = useFriendActions();

  // Drop people who are already friends from the "people you may know" list.
  const friendIds = new Set(friends.map((f) => f.id));
  const suggested = suggestedRaw.filter((u) => !friendIds.has(u.id));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{t("pages.friends")}</h1>
        <p className="text-sm text-muted">{t("pages.friendsSubtitle")}</p>
      </header>

      {/* Incoming requests */}
      {requests.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("friends.requests")}</h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <Card key={r.id} className="flex items-center gap-3 py-4">
                <Avatar user={r.from_user} size={40} />
                <div className="flex-1">
                  <UserName user={r.from_user} />
                  <p className="text-xs text-muted">{t("friends.wantsToBeFriend")}</p>
                </div>
                <button onClick={() => accept.mutate(r.id)} className="btn-primary px-4 py-1.5 text-xs">
                  {t("friends.accept")}
                </button>
                <button onClick={() => decline.mutate(r.id)} className="btn-ghost px-4 py-1.5 text-xs">
                  {t("friends.decline")}
                </button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Friends */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("friends.yourFriends", { count: friends.length })}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {friends.map((f) => (
            <Card key={f.id} className="flex items-center gap-3 py-4">
              <Avatar user={f} size={40} />
              <div className="flex-1">
                <UserName user={f} />
                <p className="text-xs text-muted">@{f.username}</p>
              </div>
            </Card>
          ))}
          {friends.length === 0 && <p className="text-sm text-muted">{t("friends.noFriends")}</p>}
        </div>
      </section>

      {/* Discover */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("friends.peopleYouMayKnow")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {suggested.map((u) => (
            <Card key={u.id} className="flex items-center gap-3 py-4">
              <Avatar user={u} size={40} />
              <div className="flex-1">
                <UserName user={u} />
                <p className="text-xs text-muted">@{u.username}</p>
              </div>
              <button
                onClick={() => u.username && sendRequest.mutate(u.username)}
                className="btn-ghost px-4 py-1.5 text-xs"
              >
                {t("common.addFriend")}
              </button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
