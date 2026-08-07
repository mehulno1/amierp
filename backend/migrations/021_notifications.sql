-- In-app notifications (bell in the header). One row per recipient per event.
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  user_id INT NOT NULL,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  reference_type VARCHAR(40) NULL,
  reference_id INT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_user (user_id, is_read, created_at)
);
