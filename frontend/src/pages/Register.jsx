import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useLanguage } from "../i18n/useLanguage";

function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [message, setMessage] = useState("");
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

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/auth/register",
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

      setMessage(data.message);

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      image="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80"
    >

        {/* Success */}
        {message && (
          <div className="bg-green-50 text-green-700 ring-1 ring-green-100 p-3 rounded-xl mb-5 text-sm">
            {message}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 ring-1 ring-red-100 p-3 rounded-xl mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Name */}
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("register.fullName")}
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("register.namePlaceholder")}
            required
            className="field mb-5"
          />

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

          {/* Phone */}
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("register.phone")}
          </label>

          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t("register.phonePlaceholder")}
            className="field mb-5"
          />

          {/* Password */}
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("common.password")}
          </label>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t("login.passwordPlaceholder")}
            required
            minLength="6"
            className="field mb-6"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3.5"
          >
            {loading ? t("register.creating") : t("register.button")}
          </button>

        </form>

        <p className="text-center text-gray-600 mt-6">

          {t("register.haveAccount")}{" "}

          <Link
            to="/login"
            className="font-semibold text-gold-600 hover:underline"
          >
            {t("nav.login")}
          </Link>

        </p>

    </AuthLayout>
  );
}

export default Register;