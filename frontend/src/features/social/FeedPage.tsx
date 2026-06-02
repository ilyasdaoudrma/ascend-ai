import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/primitives";
import { useAuthStore } from "@/stores/authStore";
import { PostCard } from "./PostCard";
import { Avatar } from "./Avatar";
import { useFeed, useCreatePost, useSuggestedUsers, useFollow } from "./hooks";

const POST_TYPE_KEYS = ["update", "progress", "workout", "milestone"] as const;

export function FeedPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [scope, setScope] = useState<"discover" | "following">("discover");
  const [content, setContent] = useState("");
  const [type, setType] = useState("update");
  const { data: posts = [], isLoading } = useFeed(scope);
  const createPost = useCreatePost();
  const { data: suggested = [] } = useSuggestedUsers();
  const follow = useFollow();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("nav.community")}</h1>
          <div className="flex rounded-full border border-border p-1 text-sm">
            {(["discover", "following"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-full px-4 py-1.5 transition-colors duration-200 ${
                  scope === s ? "bg-accent/20 text-text" : "text-muted"
                }`}
              >
                {s === "discover" ? t("feed.discover") : t("feed.followingTab")}
              </button>
            ))}
          </div>
        </header>

        {/* Composer */}
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            {user && (
              <Avatar
                user={{
                  id: user.id,
                  username: user.username,
                  full_name: user.full_name,
                  avatar: user.profile?.avatar ?? null,
                  accent_color: user.profile?.accent_color ?? "#7c5cff",
                }}
                linked={false}
              />
            )}
            <textarea
              className="input min-h-12 flex-1"
              placeholder={t("feed.composerPlaceholder")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {POST_TYPE_KEYS.map((val) => (
                <button
                  key={val}
                  onClick={() => setType(val)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    type === val ? "border-accent bg-accent/15 text-text" : "border-border text-muted"
                  }`}
                >
                  {t(`feed.types.${val}`)}
                </button>
              ))}
            </div>
            <button
              className="btn-primary"
              disabled={!content.trim() || createPost.isPending}
              onClick={() => {
                createPost.mutate(
                  { content, post_type: type },
                  { onSuccess: () => setContent("") }
                );
              }}
            >
              {createPost.isPending ? `${t("common.post")}…` : t("common.post")}
            </button>
          </div>
        </Card>

        {isLoading && <p className="text-muted">{t("common.loading")}</p>}
        {!isLoading && posts.length === 0 && (
          <Card>
            <p className="text-muted">
              {scope === "following" ? t("feed.noPostsFollowing") : t("feed.noPosts")}
            </p>
          </Card>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Sidebar */}
      <aside className="hidden space-y-4 lg:block">
        <Card>
          <h3 className="mb-4 font-semibold">{t("feed.whoToFollow")}</h3>
          <div className="space-y-4">
            {suggested.slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar user={u} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.full_name}</p>
                  <p className="truncate text-xs text-muted">@{u.username}</p>
                </div>
                <button
                  onClick={() => u.username && follow.mutate({ username: u.username, follow: true })}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  {t("common.follow")}
                </button>
              </div>
            ))}
            {suggested.length === 0 && (
              <p className="text-sm text-muted">{t("feed.followingEveryone")}</p>
            )}
          </div>
        </Card>
      </aside>
    </div>
  );
}
