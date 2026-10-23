import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

function ForgotPassword() {
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
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we will send you a link to reset it."
      image="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=80"
    >
      {sent ? (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-600">
            <MailCheck size={24} />
          </span>

          <h2 className="mt-4 text-2xl font-semibold text-ink">
            Check your email
          </h2>

          <p className="mt-2 text-gray-600">
            If an account exists for <strong>{email}</strong>, we have sent a
            reset link. It expires in 30 minutes.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Can't find it? Look in your Spam or Promotions folder.
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
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="field mb-6"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3.5"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}

      <p className="text-center text-gray-600 mt-6">
        Remembered it?{" "}
        <Link
          to="/login"
          className="font-semibold text-gold-600 hover:underline"
        >
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
