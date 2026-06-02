import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-8xl font-extrabold text-gradient">{t("notFound.code")}</p>
        <h1 className="mt-4 text-2xl font-bold">{t("notFound.title")}</h1>
        <p className="mt-2 text-muted">{t("notFound.subtitle")}</p>
        <Link to="/" className="btn-primary mt-6">
          {t("notFound.backHome")}
        </Link>
      </div>
    </div>
  );
}
