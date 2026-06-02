import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/primitives";
import { timeAgo } from "@/lib/format";
import type { Post } from "@/lib/types";
import { Avatar, UserName } from "./Avatar";
import { useComments, useAddComment, useLikePost } from "./hooks";

const TYPE_EMOJI: Record<string, string> = {
  progress: "📸", weight: "⚖️", achievement: "🏆", workout: "🏋️", milestone: "🚀", update: "💬",
};

export function PostCard({ post }: { post: Post }) {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const like = useLikePost();
  const addComment = useAddComment(post.id);
  const { data: comments = [] } = useComments(post.id, showComments);

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar user={post.author} />
        <div className="flex-1">
          <UserName user={post.author} />
          <p className="text-xs text-muted">{timeAgo(post.created_at)}</p>
        </div>
        <span className="chip">{TYPE_EMOJI[post.post_type] ?? "💬"}</span>
      </div>

      {post.content && <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>}
      {post.image_url && (
        <img src={post.image_url} alt="" className="max-h-96 w-full rounded-xl object-cover" />
      )}

      <div className="flex items-center gap-5 border-t border-border pt-3 text-sm">
        <button
          onClick={() => like.mutate(post.id)}
          className={`flex items-center gap-1.5 transition ${
            post.liked_by_me ? "text-danger" : "text-muted hover:text-text"
          }`}
        >
          {post.liked_by_me ? "❤️" : "🤍"} {post.like_count}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-muted transition hover:text-text"
        >
          💬 {post.comment_count}
        </button>
      </div>

      {showComments && (
        <div className="space-y-3 border-t border-border pt-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar user={c.author} size={30} />
              <div className="rounded-xl bg-white/5 px-3 py-2">
                <UserName user={c.author} className="text-sm" />
                <p className="text-sm text-muted">{c.content}</p>
              </div>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) {
                addComment.mutate(draft);
                setDraft("");
              }
            }}
            className="flex gap-2"
          >
            <input
              className="input py-2"
              placeholder={t("feed.commentPlaceholder")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="btn-primary px-4" disabled={addComment.isPending}>
              {t("common.send")}
            </button>
          </form>
        </div>
      )}
    </Card>
  );
}
