import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=80";

function RoomGallery({ photos, alt }) {
  const list = photos.length ? photos : [FALLBACK_IMAGE];

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const current = Math.min(active, list.length - 1);
  const go = (step) => setActive((current + step + list.length) % list.length);

  // Keyboard control while the full-screen view is open
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % list.length);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + list.length) % list.length);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, list.length]);

  const fallback = (e) => {
    if (e.currentTarget.src !== FALLBACK_IMAGE) {
      e.currentTarget.src = FALLBACK_IMAGE;
    }
  };

  return (
    <div>
      {/* Main photo */}
      <div className="group relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full"
          aria-label="View photo full screen"
        >
          <img
            src={list[current]}
            onError={fallback}
            alt={alt}
            className="h-[300px] w-full object-cover md:h-[440px]"
          />
        </button>

        <span className="pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
          <Expand size={14} />
          {current + 1} / {list.length}
        </span>

        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {list.length > 1 && (
        <div className="flex gap-3 overflow-x-auto px-8 pt-5">
          {list.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                index === current
                  ? "ring-gold-500"
                  : "ring-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`Show photo ${index + 1}`}
            >
              <img
                src={src}
                onError={fallback}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full-screen view */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          <img
            src={list[current]}
            onError={fallback}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />

          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Previous photo"
              >
                <ChevronLeft size={26} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Next photo"
              >
                <ChevronRight size={26} />
              </button>

              <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/80">
                {current + 1} / {list.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default RoomGallery;
