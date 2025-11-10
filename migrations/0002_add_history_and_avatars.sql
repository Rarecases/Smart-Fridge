-- Update users table to add avatar selection
ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT 'chef1';
ALTER TABLE users ADD COLUMN total_recipes_cooked INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN best_streak INTEGER DEFAULT 0;

-- Update cooking_history table structure
DROP TABLE IF EXISTS cooking_history;
CREATE TABLE cooking_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  recipe_id INTEGER NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_image TEXT,
  completed BOOLEAN DEFAULT 1,
  cooking_time_minutes INTEGER,
  rating INTEGER,
  notes TEXT,
  cooked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_icon TEXT,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create scanned_products table for barcode scanning
CREATE TABLE IF NOT EXISTS scanned_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  barcode TEXT NOT NULL,
  product_name TEXT,
  brand TEXT,
  ingredients TEXT,
  nutritional_info TEXT,
  allergens TEXT,
  expiry_date TEXT,
  scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cooking_history_user ON cooking_history(user_id, cooked_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_scanned_products_user ON scanned_products(user_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scanned_products_barcode ON scanned_products(barcode);
