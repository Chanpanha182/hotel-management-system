-- Housekeeping state for the Room Board: a room becomes 'dirty' when a
-- guest checks out, and staff mark it 'clean' again after cleaning.
ALTER TABLE rooms
    ADD COLUMN housekeeping ENUM('clean', 'dirty') NOT NULL DEFAULT 'clean' AFTER status;
