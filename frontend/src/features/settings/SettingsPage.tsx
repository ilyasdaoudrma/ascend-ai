import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/format";
import { useAuthStore } from "@/stores/authStore";
import { Card } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const ACCENTS = ["#7c5cff", "#22d3ee", "#34d399", "#fbbf24", "#f87171", "#ec4899"];

export function SettingsPage() {
  const { t } = useTranslation();
  const { user, fetchMe } = useAuthStore();
  const profile = user?.profile;
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [accent, setAccent] = useState(profile?.accent_color ?? "#7c5cff");
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  const uploadImage = async (field: "avatar" | "banner", file: File) => {
    setUploading(field);
    try {
      const form = new FormData();
      form.append(field, file);
      await api.patch("/auth/profile/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchMe();
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/me/", { full_name: fullName });
      await api.patch("/auth/profile/", {
        bio,
        country,
        accent_color: accent,
        is_public: isPublic,
      });
      await fetchMe();
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
          <p className="text-sm text-muted">{t("settings.subtitle")}</p>
        </div>
        {user?.username && (
          <Link to={`/u/${user.username}`} className="btn-ghost">
            👁 {t("settings.viewProfile")}
          </Link>
        )}
      </header>

      {/* Appearance */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">{t("settings.appearance")}</h2>
          <p className="text-sm text-muted">{t("settings.theme")} · {t("language.label")}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </Card>

      {/* Banner + avatar */}
      <Card className="overflow-hidden p-0">
        <div
          className="relative h-40"
          style={{
            background: profile?.banner
              ? `url(${mediaUrl(profile.banner)}) center/cover`
              : `linear-gradient(135deg, ${accent}, #22d3ee)`,
          }}
        >
          <button
            onClick={() => bannerInput.current?.click()}
            className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur"
          >
            {uploading === "banner" ? t("settings.uploading") : t("settings.changeBanner")}
          </button>
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadImage("banner", e.target.files[0])}
          />
        </div>

        <div className="flex items-center gap-4 p-6">
          <div className="relative -mt-16">
            <div
              className="grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border-4 border-card text-3xl font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${accent}, #22d3ee)` }}
            >
              {profile?.avatar ? (
                <img src={mediaUrl(profile.avatar) ?? undefined} alt="" className="h-full w-full object-cover" />
              ) : (
                user?.full_name?.[0] ?? "U"
              )}
            </div>
          </div>
          <button onClick={() => avatarInput.current?.click()} className="btn-ghost">
            {uploading === "avatar" ? t("settings.uploading") : t("settings.uploadPhoto")}
          </button>
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadImage("avatar", e.target.files[0])}
          />
        </div>
      </Card>

      {/* Profile fields */}
      <Card className="space-y-5">
        <div>
          <label className="label">{t("settings.fullName")}</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label">{t("settings.bio")}</label>
          <textarea className="input min-h-20" value={bio} maxLength={280}
            onChange={(e) => setBio(e.target.value)} placeholder={t("settings.bioPlaceholder")} />
        </div>
        <div>
          <label className="label">{t("settings.country")}</label>
          <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div>
          <label className="label">{t("settings.accentColor")}</label>
          <div className="flex gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                className={`h-9 w-9 rounded-full border-2 transition ${
                  accent === c ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
            className="h-5 w-5 accent-[var(--accent)]" />
          <span className="text-sm">{t("settings.makePublic")}</span>
        </label>

        <div className="flex items-center gap-3">
          <button onClick={save} className="btn-primary" disabled={saving}>
            {saving ? t("settings.saving") : t("settings.saveChanges")}
          </button>
          {savedAt && <span className="text-sm text-success">{t("settings.saved")}</span>}
        </div>
      </Card>
    </div>
  );
}
