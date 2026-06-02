import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/layout/Navbar";
import { Card, Stat } from "@/components/ui/primitives";
import { mediaUrl } from "@/lib/format";
import { useAuthStore } from "@/stores/authStore";
import { usePublicProfile, useFollow, useOpenChat, useFriendActions } from "./hooks";

export function PublicProfilePage() {
  const { t } = useTranslation();
  const { username } = useParams();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { data: profile, isLoading, isError } = usePublicProfile(username);
  const follow = useFollow();
  const openChat = useOpenChat();
  const { sendRequest } = useFriendActions();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="grid min-h-screen place-items-center text-center">
        <div>
          <h1 className="text-2xl font-bold">{t("profile.notFound")}</h1>
          <Link to="/" className="btn-primary mt-4">{t("profile.goHome")}</Link>
        </div>
      </div>
    );
  }

  const isMe = me?.id === profile.id;
  const accent = profile.profile.accent_color;

  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      {/* Banner */}
      <div
        className="h-56 w-full"
        style={{
          background: profile.banner
            ? `url(${mediaUrl(profile.banner)}) center/cover`
            : `linear-gradient(135deg, ${accent}, #22d3ee)`,
        }}
      />

      <div className="mx-auto -mt-16 max-w-4xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div
              className="grid h-28 w-28 place-items-center rounded-3xl border-4 border-bg text-4xl font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${accent}, #22d3ee)` }}
            >
              {profile.avatar ? (
                <img src={mediaUrl(profile.avatar) ?? undefined} alt="" className="h-full w-full rounded-3xl object-cover" />
              ) : (
                profile.full_name?.[0] ?? "?"
              )}
            </div>
            <div className="pb-2">
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-sm text-muted">@{profile.username}</p>
            </div>
          </div>

          {!isMe && me && (
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                onClick={() =>
                  follow.mutate({ username: profile.username, follow: !profile.is_following })
                }
                className={profile.is_following ? "btn-ghost" : "btn-primary"}
                disabled={follow.isPending}
              >
                {profile.is_following ? t("common.following") : t("common.follow")}
              </button>
              <button
                onClick={() => sendRequest.mutate(profile.username)}
                className="btn-ghost"
                disabled={sendRequest.isPending}
              >
                {sendRequest.isSuccess ? t("profile.requestSent") : t("common.addFriend")}
              </button>
              <button
                onClick={() =>
                  openChat.mutate(profile.username, {
                    onSuccess: () => navigate("/dashboard/messages"),
                  })
                }
                className="btn-ghost"
              >
                💬 {t("common.message")}
              </button>
            </div>
          )}
        </div>

        {profile.profile.bio && (
          <p className="mt-5 max-w-xl text-[15px] text-muted">{profile.profile.bio}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {profile.profile.goal && <span className="chip">🎯 {t(`profile.goals.${profile.profile.goal}`)}</span>}
          {profile.profile.country && <span className="chip">📍 {profile.profile.country}</span>}
          <span className="chip">
            {t("profile.joined", { date: new Date(profile.date_joined).toLocaleDateString(undefined, { month: "short", year: "numeric" }) })}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card><Stat label={t("profile.followers")} value={profile.stats.followers} /></Card>
          <Card><Stat label={t("profile.following")} value={profile.stats.following} /></Card>
          <Card><Stat label={t("profile.workouts")} value={profile.stats.workouts} /></Card>
          <Card><Stat label={t("profile.streak")} value={`${profile.stats.streak}🔥`} /></Card>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card><Stat label={t("profile.level")} value={profile.stats.level} /></Card>
          <Card><Stat label={t("profile.xp")} value={profile.stats.xp.toLocaleString()} /></Card>
          <Card><Stat label={t("profile.achievements")} value={profile.stats.achievements} /></Card>
        </div>
      </div>
    </div>
  );
}
