import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthShell } from "./AuthShell";
import { useAuthStore } from "@/stores/authStore";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError(t("auth.invalid"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="text-accent hover:underline">
            {t("auth.createAccount")}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">{t("auth.email")}</label>
          <input type="email" className="input" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">{t("auth.password")}</label>
          <input type="password" className="input" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? t("auth.loggingIn") : t("auth.login")}
        </button>
      </form>
    </AuthShell>
  );
}
