import { Link } from "react-router-dom";
import type { SocialUser } from "@/lib/types";
import { cn, mediaUrl } from "@/lib/format";

export function Avatar({
  user,
  size = 40,
  linked = true,
}: {
  user: SocialUser;
  size?: number;
  linked?: boolean;
}) {
  const initials = (user.full_name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");

  const inner = user.avatar ? (
    <img
      src={mediaUrl(user.avatar) ?? undefined}
      alt={user.full_name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover"
    />
  ) : (
    <span
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${user.accent_color}, #22d3ee)`,
        fontSize: size * 0.4,
      }}
      className="grid place-items-center rounded-full font-bold text-white"
    >
      {initials}
    </span>
  );

  if (linked && user.username) {
    return (
      <Link to={`/u/${user.username}`} className="shrink-0">
        {inner}
      </Link>
    );
  }
  return <span className="shrink-0">{inner}</span>;
}

export function UserName({ user, className }: { user: SocialUser; className?: string }) {
  const content = <span className={cn("font-semibold", className)}>{user.full_name}</span>;
  if (user.username) {
    return (
      <Link to={`/u/${user.username}`} className="hover:underline">
        {content}
      </Link>
    );
  }
  return content;
}
