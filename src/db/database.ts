import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../certs.db');
const db = new Database(dbPath);

// Drop old table if it exists (for schema migration)
db.exec('DROP TABLE IF EXISTS certificates');

const createTableSQL = `
  CREATE TABLE certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cert_id TEXT NOT NULL,
    issuer TEXT NOT NULL,
    common_name TEXT NOT NULL,
    name_values TEXT,
    not_after TEXT,
    not_before TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`;

db.exec(createTableSQL);

console.log('Database initialized at:', dbPath);

export default db;
