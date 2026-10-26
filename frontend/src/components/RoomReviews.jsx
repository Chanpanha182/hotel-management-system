import { useEffect, useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import Stars from "./Stars";

const PAGE_SIZE = 5;

function RoomReviews({ roomId }) {
  const [result, setResult] = useState({ roomId: null, reviews: [], summary: null });
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/reviews/room/${roomId}`)
      .then((response) => response.json())
      .then((data) =>
        setResult({ roomId, reviews: data.data || [], summary: data.summary || null })
      )
      .catch((error) => {
        console.error(error);
        setResult({ roomId, reviews: [], summary: null });
      });
  }, [roomId]);

  const loading = result.roomId !== roomId;
  const { reviews, summary } = result;

  // How many reviews gave each star value, for the bar chart
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));

  return (
    <section className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Guest Reviews</h2>

      {loading ? (
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-gray-100"></div>
      ) : reviews.length === 0 ? (
        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-gold-50 p-5 text-gray-600">
          <MessageSquareQuote className="shrink-0 text-gold-600" size={28} />
          <p>No reviews yet. Guests who stay in this room can share their experience after check-out.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mt-6 grid gap-6 rounded-2xl bg-gold-50 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="text-center sm:pr-6 sm:border-r sm:border-gold-200">
              <p className="font-display text-5xl font-semibold text-ink">
                {summary.average.toFixed(1)}
              </p>
              <Stars value={summary.average} size={18} className="mt-2" />
              <p className="mt-1 text-sm text-gray-500">
                {summary.count} {summary.count === 1 ? "review" : "reviews"}
              </p>
            </div>

            <div className="space-y-1.5">
              {breakdown.map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-3 text-sm">
                  <span className="w-10 text-gray-600">{stars} star</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gold-400"
                      style={{ width: `${(count / summary.count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-6 text-right text-gray-500">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* List */}
          <ul className="mt-6 divide-y divide-gray-100">
            {reviews.slice(0, visible).map((review) => (
              <li key={review.id} className="py-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-100 font-semibold text-gold-700">
                    {review.guest_name.charAt(0).toUpperCase()}
                  </span>

                  <div>
                    <p className="font-semibold text-ink">{review.guest_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <Stars value={review.rating} size={15} className="ml-auto" />
                </div>

                {review.comment && (
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-600">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {reviews.length > visible && (
            <button
              type="button"
              onClick={() => setVisible((n) => n + PAGE_SIZE)}
              className="mt-2 font-semibold text-gold-600 hover:underline"
            >
              Show more reviews
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default RoomReviews;
