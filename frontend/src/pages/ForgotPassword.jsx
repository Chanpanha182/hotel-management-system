import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useLanguage } from "../i18n/useLanguage";

function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSent(true);
    } catch (error) {
      setError(error.message || t("forgot.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("forgot.title")}
      subtitle={t("forgot.subtitle")}
      image="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=80"
    >
      {sent ? (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-600">
            <MailCheck size={24} />
          </span>

          <h2 className="mt-4 text-2xl font-semibold text-ink">
            {t("forgot.checkEmail")}
          </h2>

          <p className="mt-2 text-gray-600">
            {t("forgot.sent", { email })}
          </p>

          <p className="mt-4 text-sm text-gray-500">
            {t("forgot.spam")}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-700 ring-1 ring-red-100 p-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("common.email")}
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.emailPlaceholder")}
            required
            className="field mb-6"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3.5"
          >
            {loading ? t("forgot.sending") : t("forgot.button")}
          </button>
        </form>
      )}

      <p className="text-center text-gray-600 mt-6">
        {t("forgot.remembered")}{" "}
        <Link
          to="/login"
          className="font-semibold text-gold-600 hover:underline"
        >
          {t("forgot.backToLogin")}
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
