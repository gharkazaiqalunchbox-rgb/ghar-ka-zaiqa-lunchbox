# Ghar Ka Zaiqa - Database Documentation

## Overview

The application now uses **SQLite** via `better-sqlite3` for data persistence instead of JSON files. This provides better performance, data integrity, and scalability.

## Database File

- **Location**: `data/yummy.db`
- **Type**: SQLite 3
- **Size**: Automatically grows as data is added
- **Backup**: Simply copy `yummy.db` to backup

## Database Schema

### Users Table

Stores admin login credentials.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### Menu Table

Stores menu items for the restaurant.

```sql
CREATE TABLE menu (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  image TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### Gallery Table

Stores gallery images and descriptions.

```sql
CREATE TABLE gallery (
  id TEXT PRIMARY KEY,
  image TEXT NOT NULL,
  alt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### Orders Table

Stores customer orders with status tracking.

```sql
CREATE TABLE orders (
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
```

## Default Admin User

The application automatically creates a default admin user on first run:

- **Email**: `admin@ghar-ka-zaiqa.com`
- **Password**: `admin123`

⚠️ **Important**: Change this password in production!

## API Compatibility

All existing API endpoints remain unchanged. The database migration is transparent to the frontend:

- `/api/login` - Admin authentication
- `/api/menu` - Menu management
- `/api/gallery` - Gallery management
- `/api/orders` - Order management
- `/api/orders/track` - Order tracking

## Data Migration from JSON

If migrating from the old JSON-based system:

1. The database is automatically initialized on first run
2. JSON files (`menu.json`, `gallery.json`, `orders.json`, `users.json`) are no longer used
3. To migrate existing data, manually insert records from JSON files into the database

Example using sqlite3 CLI:

```bash
sqlite3 data/yummy.db
# Then use INSERT statements to migrate data from your JSON files
```

## Performance Benefits

✅ Faster queries with indexing capability
✅ Data integrity with FOREIGN_KEYS
✅ Automatic schema management
✅ Better scalability for large datasets
✅ Single file for easy deployment and backup

## Backup & Restore

### Backup

```bash
cp data/yummy.db data/yummy.db.backup
```

### Restore

```bash
cp data/yummy.db.backup data/yummy.db
```

## Troubleshooting

### Database corruption

If `yummy.db` becomes corrupted:

1. Stop the server
2. Delete `yummy.db`
3. Start the server - it will recreate the database with default data
4. Restore from backup if needed

### Checking database integrity

```bash
sqlite3 data/yummy.db "PRAGMA integrity_check;"
```

### Viewing database contents

```bash
sqlite3 data/yummy.db ".mode column" ".headers on"
sqlite3 data/yummy.db "SELECT * FROM orders;"
```

## Development Notes

- Database initialization happens automatically in `data/db.js`
- All queries are prepared statements (security: SQL injection protection)
- The database connection is persistent throughout server runtime
- Foreign keys are enabled for referential integrity
