import { Link } from "react-router-dom";
import { Users, BedDouble, Maximize, ArrowRight } from "lucide-react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80";

function RoomCard({ room, search = "" }) {
  return (
    <Link
      to={`/rooms/${room.id}${search}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Image */}
      <div className="relative h-60 overflow-hidden">
        <img
          src={room.image || FALLBACK_IMAGE}
          onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
          alt={room.room_name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />

        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-700 backdrop-blur">
          {room.room_type}
        </span>

        <div className="absolute bottom-4 right-4 rounded-2xl bg-ink/85 px-4 py-2 text-white backdrop-blur">
          <span className="font-display text-xl font-semibold">
            ${Number(room.price).toFixed(0)}
          </span>
          <span className="text-xs text-gray-300"> / night</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl font-semibold text-ink">
          {room.room_name}
        </h3>

        {room.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
            {room.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <Users size={16} className="text-gold-500" />
            {room.capacity} Guests
          </span>

          {room.bed_type && (
            <span className="flex items-center gap-1.5">
              <BedDouble size={16} className="text-gold-500" />
              {room.bed_type}
            </span>
          )}

          {room.room_size && (
            <span className="flex items-center gap-1.5">
              <Maximize size={16} className="text-gold-500" />
              {room.room_size}
            </span>
          )}
        </div>

        <div className="mt-auto pt-6">
          <span className="flex items-center gap-2 text-sm font-semibold text-gold-600 transition group-hover:gap-3">
            View Details
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default RoomCard;
