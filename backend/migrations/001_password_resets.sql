-- Password reset links. Only a SHA-256 hash of each token is stored,
-- so a leaked database cannot be used to reset passwords.
CREATE TABLE IF NOT EXISTS password_resets (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY token_hash (token_hash),
    KEY user_id (user_id),
    CONSTRAINT password_resets_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
