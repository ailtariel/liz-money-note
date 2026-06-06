import {
  getDatabase,
  persistDatabase,
  resetDatabaseConnection,
  sqlite
} from './connection';

export async function exportDatabaseJson() {
  const db = await getDatabase();
  return db.exportToJson('full');
}

export async function importDatabaseJson(json: string) {
  await sqlite.importFromJson(json);
  await persistDatabase();
  await resetDatabaseConnection();
  await getDatabase();
}
