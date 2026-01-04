import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("gallery.db");

export function initDB() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY NOT NULL,
      uri TEXT NOT NULL,
      embedding TEXT NOT NULL
    );
  `);
}

export function saveEmbedding(id: string, uri: string, embedding: number[]) {
  db.runSync(
    `INSERT OR REPLACE INTO images (id, uri, embedding) VALUES (?, ?, ?)`,
    [id, uri, JSON.stringify(embedding)]
  );
}

export function getAllEmbeddings(): Promise<
  { uri: string; embedding: number[] }[]
> {
  return Promise.resolve(
    db
      .getAllSync<{ uri: string; embedding: string }>(
        `SELECT uri, embedding FROM images`
      )
      .map((row) => ({
        uri: row.uri,
        embedding: JSON.parse(row.embedding),
      }))
  );
}

export function getIndexedPhotoIds(): Set<string> {
  const rows = db.getAllSync<{ id: string }>(`SELECT id FROM images`);
  return new Set(rows.map((row) => row.id));
}
