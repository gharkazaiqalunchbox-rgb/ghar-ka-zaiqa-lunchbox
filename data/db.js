const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "yummy.db");
const db = new Database(dbPath, {
  timeout: 10000,
});

// Apply busy handler before WAL — switching journal mode can need a brief exclusive lock.
db.pragma("busy_timeout = 10000");

function sleepSync(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      /* fallback spin */
    }
  }
}

function enableWalWithRetries() {
  const maxAttempts = 30;
  const delayMs = 200;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      db.pragma("journal_mode = WAL");
      return;
    } catch (e) {
      if (e && e.code === "SQLITE_BUSY" && i < maxAttempts - 1) {
        sleepSync(delayMs);
        continue;
      }
      console.warn(
        "[db] WAL mode not enabled:",
        e && e.message,
        "\n  → Another program may have data/yummy.db open, or a second server is running.",
        "\n  → Continuing with default journal mode. Stop duplicate `node server.js` processes and retry.",
      );
      return;
    }
  }
}

enableWalWithRetries();

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize database schema
function initializeDatabase() {
  // Users table for admin login
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Menu items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT NOT NULL,
      image TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Gallery items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      image TEXT NOT NULL,
      alt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      notes TEXT,
      items TEXT NOT NULL,
      total TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Verification codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code TEXT NOT NULL,
      data TEXT,
      expiresAt TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      customerEmail TEXT NOT NULL,
      reviewText TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      approved INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create default admin user if none exist
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (adminCount.count === 0) {
    const defaultUser = {
      id: "admin-1",
      email: "gharkazaiqalunchbox@gmail.com",
      password: "admin123", // In production, hash this!
      role: "admin",
    };
    db.prepare(
      "INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)",
    ).run(
      defaultUser.id,
      defaultUser.email,
      defaultUser.password,
      defaultUser.role,
    );
    console.log(
      `✓ Default admin user created (email: ${defaultUser.email}, password: ${defaultUser.password})`,
    );
  }
}

// Initialize on module load
initializeDatabase();

// Query helpers - prepared AFTER initialization
const queries = {
  // Users
  getUserByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  getAllUsers: db.prepare("SELECT * FROM users"),
  createUser: db.prepare(
    "INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)",
  ),
  updateUser: db.prepare(
    "UPDATE users SET email = ?, password = ?, role = ? WHERE id = ?",
  ),
  deleteUser: db.prepare("DELETE FROM users WHERE id = ?"),

  // Menu
  getMenuById: db.prepare("SELECT * FROM menu WHERE id = ?"),
  getAllMenu: db.prepare("SELECT * FROM menu ORDER BY createdAt DESC"),
  createMenu: db.prepare(
    "INSERT INTO menu (id, category, name, description, price, image) VALUES (?, ?, ?, ?, ?, ?)",
  ),
  updateMenu: db.prepare(
    "UPDATE menu SET category = ?, name = ?, description = ?, price = ?, image = ? WHERE id = ?",
  ),
  deleteMenu: db.prepare("DELETE FROM menu WHERE id = ?"),

  // Gallery
  getGalleryById: db.prepare("SELECT * FROM gallery WHERE id = ?"),
  getAllGallery: db.prepare("SELECT * FROM gallery ORDER BY createdAt DESC"),
  createGallery: db.prepare(
    "INSERT INTO gallery (id, image, alt) VALUES (?, ?, ?)",
  ),
  updateGallery: db.prepare(
    "UPDATE gallery SET image = ?, alt = ? WHERE id = ?",
  ),
  deleteGallery: db.prepare("DELETE FROM gallery WHERE id = ?"),

  // Orders
  getOrderById: db.prepare("SELECT * FROM orders WHERE id = ?"),
  getAllOrders: db.prepare("SELECT * FROM orders ORDER BY createdAt DESC"),
  getOrdersByEmail: db.prepare(
    "SELECT * FROM orders WHERE email = ? ORDER BY createdAt DESC",
  ),
  getOrdersByEmailAndId: db.prepare(
    "SELECT * FROM orders WHERE email = ? AND id = ?",
  ),
  createOrder: db.prepare(
    "INSERT INTO orders (id, customerName, email, phone, address, notes, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ),
  updateOrderStatus: db.prepare(
    "UPDATE orders SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
  ),
  deleteOrder: db.prepare("DELETE FROM orders WHERE id = ?"),
  createVerification: db.prepare(
    "INSERT INTO verifications (id, email, purpose, code, data, expiresAt) VALUES (?, ?, ?, ?, ?, ?)",
  ),
  getVerificationById: db.prepare("SELECT * FROM verifications WHERE id = ?"),
  getVerificationByEmailPurposeCode: db.prepare(
    "SELECT * FROM verifications WHERE email = ? AND purpose = ? AND code = ? AND expiresAt >= ?",
  ),
  deleteVerificationById: db.prepare("DELETE FROM verifications WHERE id = ?"),
  deleteExpiredVerifications: db.prepare(
    "DELETE FROM verifications WHERE expiresAt <= ?",
  ),

  // Reviews
  createReview: db.prepare(
    "INSERT INTO reviews (id, customerName, customerEmail, reviewText, rating, approved) VALUES (?, ?, ?, ?, ?, ?)",
  ),
  getApprovedReviews: db.prepare(
    "SELECT * FROM reviews WHERE approved = 1 ORDER BY createdAt DESC",
  ),
  getAllReviews: db.prepare("SELECT * FROM reviews ORDER BY createdAt DESC"),
  getReviewById: db.prepare("SELECT * FROM reviews WHERE id = ?"),
  approveReview: db.prepare("UPDATE reviews SET approved = 1 WHERE id = ?"),
  rejectReview: db.prepare("UPDATE reviews SET approved = 0 WHERE id = ?"),
  deleteReview: db.prepare("DELETE FROM reviews WHERE id = ?"),
};

// Helper functions that mimic the JSON API
function readJson(key, fallback = []) {
  try {
    switch (key) {
      case "menu":
        return queries.getAllMenu.all().map((row) => ({
          id: row.id,
          category: row.category,
          name: row.name,
          description: row.description,
          price: row.price,
          image: row.image,
        }));
      case "gallery":
        return queries.getAllGallery.all().map((row) => ({
          id: row.id,
          image: row.image,
          alt: row.alt,
        }));
      case "orders":
        return queries.getAllOrders.all().map((row) => ({
          id: row.id,
          customerName: row.customerName,
          email: row.email,
          phone: row.phone,
          address: row.address,
          notes: row.notes,
          items: JSON.parse(row.items),
          total: row.total,
          status: row.status,
          createdAt: row.createdAt,
        }));
      default:
        return fallback;
    }
  } catch (error) {
    console.error(`Error reading from database (${key}):`, error);
    return fallback;
  }
}

function writeJson(key, data) {
  try {
    // This function is kept for compatibility but data is managed via direct queries
    console.log(
      `Note: writeJson called for ${key}, but data is stored in database`,
    );
  } catch (error) {
    console.error(`Error writing to database (${key}):`, error);
  }
}

// Export database and helpers
module.exports = {
  db,
  queries,
  readJson,
  writeJson,
  initializeDatabase,
};
