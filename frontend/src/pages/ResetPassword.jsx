import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setDone(true);

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Use at least 6 characters."
      image="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80"
    >
      {!token ? (
        <div className="bg-red-50 text-red-700 ring-1 ring-red-100 p-4 rounded-xl text-sm">
          This reset link is not valid.{" "}
          <Link to="/forgot-password" className="font-semibold underline">
            Request a new one
          </Link>
          .
        </div>
      ) : done ? (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-600">
            <CheckCircle size={24} />
          </span>

          <h2 className="mt-4 text-2xl font-semibold text-ink">
            Password changed
          </h2>

          <p className="mt-2 text-gray-600">
            Taking you to the login page...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-700 ring-1 ring-red-100 p-3 rounded-xl mb-5 text-sm">
              {error}{" "}
              {error.includes("expired") && (
                <Link to="/forgot-password" className="font-semibold underline">
                  Request a new link
                </Link>
              )}
            </div>
          )}

          <label className="mb-2 block text-sm font-medium text-gray-700">
            New Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a new password"
            required
            minLength="6"
            className="field mb-5"
          />

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Type it again"
            required
            minLength="6"
            className="field mb-6"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3.5"
          >
            {loading ? "Saving..." : "Change Password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
