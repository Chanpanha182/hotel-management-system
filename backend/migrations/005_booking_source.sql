-- Where a booking came from: the website, or the front desk (walk-in guest).
ALTER TABLE bookings
    ADD COLUMN source ENUM('online', 'walk_in') NOT NULL DEFAULT 'online' AFTER booking_status;
