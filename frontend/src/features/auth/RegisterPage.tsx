import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { AuthShell } from "./AuthShell";
import { useAuthStore } from "@/stores/authStore";

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.password_confirm) {
      setError(t("auth.passwordsMismatch"));
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/onboarding");
    } catch (err) {
      const ax = err as AxiosError<Record<string, string[]>>;
      const data = ax.response?.data;
      const firstError = data ? Object.values(data)[0]?.[0] : null;
      setError(firstError ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="text-accent hover:underline">
            {t("auth.login")}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">{t("auth.fullName")}</label>
          <input className="input" value={form.full_name} onChange={update("full_name")} required />
        </div>
        <div>
          <label className="label">{t("auth.email")}</label>
          <input type="email" className="input" value={form.email} onChange={update("email")} required />
        </div>
        <div>
          <label className="label">{t("auth.password")}</label>
          <input type="password" className="input" value={form.password} onChange={update("password")} required />
        </div>
        <div>
          <label className="label">{t("auth.confirmPassword")}</label>
          <input type="password" className="input" value={form.password_confirm} onChange={update("password_confirm")} required />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? t("auth.creating") : t("auth.createAccountBtn")}
        </button>
      </form>
    </AuthShell>
  );
}
