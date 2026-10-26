import { useState } from "react";
import { Star, X } from "lucide-react";
import { useLanguage } from "../i18n/useLanguage";

const MAX_COMMENT = 1000;

function ReviewModal({ booking, onClose, onSaved }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const shown = hover || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      setError(t("reviewForm.chooseRating"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + "/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ booking_id: booking.id, rating, comment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("reviewForm.saveError"));
      }

      onSaved(rating);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">{t("reviewForm.title")}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {booking.room_name} · {t("common.bookingNumber", { id: booking.id })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label={t("common.close")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Star picker */}
        <div className="mt-6 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setRating(n);
                setError("");
              }}
              onMouseEnter={() => setHover(n)}
              className="p-1 transition hover:scale-110"
              aria-label={t("reviewForm.starButton", { count: n })}
            >
              <Star
                size={34}
                strokeWidth={0}
                fill="currentColor"
                className={n <= shown ? "text-gold-400" : "text-gray-200"}
              />
            </button>
          ))}

          <span className="ml-3 text-sm font-medium text-gray-600">
            {shown ? t(`reviewForm.label.${shown}`) : ""}
          </span>
        </div>

        <label className="mt-6 block text-sm font-medium text-gray-700">
          {t("reviewForm.yourReview")}{" "}
          <span className="font-normal text-gray-400">{t("reviewForm.optional")}</span>
        </label>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
          rows={4}
          placeholder={t("reviewForm.placeholder")}
          className="field mt-2"
        />

        <p className="mt-1 text-right text-xs text-gray-400">
          {comment.length}/{MAX_COMMENT}
        </p>

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-gold mt-5 w-full py-3.5">
          {saving ? t("reviewForm.sending") : t("reviewForm.submit")}
        </button>
      </form>
    </div>
  );
}

export default ReviewModal;
