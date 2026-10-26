-- Guest reviews: one per booking, written after the stay.
-- Staff can hide a review (status = 'hidden') instead of deleting it.
CREATE TABLE IF NOT EXISTS reviews (
    id INT NOT NULL AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT NULL,
    status ENUM('visible', 'hidden') NOT NULL DEFAULT 'visible',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY booking_id (booking_id),
    KEY room_status (room_id, status),
    CONSTRAINT reviews_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT reviews_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT reviews_room_fk FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)
);
