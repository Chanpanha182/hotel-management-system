-- Front-desk staff: can use the Room Board, walk-ins, bookings and
-- payments, but not rooms, users, reviews, reports or the dashboard.
ALTER TABLE users
    MODIFY COLUMN role ENUM('customer', 'receptionist', 'admin') NOT NULL DEFAULT 'customer';
