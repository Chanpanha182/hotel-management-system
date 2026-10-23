// rooms.gallery is stored as a JSON array of image URLs (or null)
export function parseGallery(gallery) {
  if (Array.isArray(gallery)) return gallery;

  try {
    const list = JSON.parse(gallery || "[]");
    return Array.isArray(list) ? list.filter(Boolean) : [];
  } catch {
    return [];
  }
}

// Cover photo first, then the gallery, without duplicates
export function getRoomPhotos(room) {
  const photos = [room?.image, ...parseGallery(room?.gallery)]
    .map((url) => String(url || "").trim())
    .filter(Boolean);

  return [...new Set(photos)];
}
