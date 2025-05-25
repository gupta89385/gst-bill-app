let db = null;

export async function initDB() {
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    db = new SQL.Database();

    createTables();
    console.log("SQLite DB initialized");
}

function createTables() {
    db.run(`
    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT CHECK(type IN ('customer', 'distributor')),
      gstin TEXT,
      phone TEXT,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      sku TEXT,
      hsn TEXT,
      gst_rate INTEGER,
      unit TEXT,
      stock INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER,
      item_id INTEGER,
      quantity INTEGER,
      rate REAL,
      date TEXT,
      FOREIGN KEY (party_id) REFERENCES parties(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER,
      item_id INTEGER,
      quantity INTEGER,
      rate REAL,
      date TEXT,
      FOREIGN KEY (party_id) REFERENCES parties(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );
  `);

    console.log("Tables created.");
}

export function getDB() {
    return db;
}
