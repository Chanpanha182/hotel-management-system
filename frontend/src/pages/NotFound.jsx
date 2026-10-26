import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/useLanguage";

function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-8xl font-bold text-blue-600 mb-4">
          404
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t("notFound.title")}
        </h1>

        <p className="text-gray-500 mb-8">
          {t("notFound.text")}
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} />
            {t("notFound.back")}
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Home size={18} />
            {t("notFound.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;