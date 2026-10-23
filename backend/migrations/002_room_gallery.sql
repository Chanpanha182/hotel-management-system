-- Extra room photos, stored as a JSON array of image URLs.
-- The existing rooms.image column stays the cover photo.
ALTER TABLE rooms ADD COLUMN gallery TEXT NULL AFTER image;
