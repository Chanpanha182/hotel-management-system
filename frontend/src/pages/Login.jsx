import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useLanguage } from "../i18n/useLanguage";

function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      // Save login information
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Go home
      navigate("/");

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      image="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=80"
    >

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 ring-1 ring-red-100 p-3 rounded-xl mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Email */}
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("common.email")}
          </label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t("login.emailPlaceholder")}
            required
            className="field mb-5"
          />

          {/* Password */}
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              {t("common.password")}
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-gold-600 hover:underline"
            >
              {t("login.forgot")}
            </Link>
          </div>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t("login.passwordPlaceholder")}
            required
            className="field mb-6"
          />

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3.5"
          >
            {loading ? t("login.loggingIn") : t("login.button")}
          </button>

        </form>

        <p className="text-center text-gray-600 mt-6">

          {t("login.noAccount")}{" "}

          <Link
            to="/register"
            className="font-semibold text-gold-600 hover:underline"
          >
            {t("login.register")}
          </Link>

        </p>

    </AuthLayout>
  );
}

export default Login;