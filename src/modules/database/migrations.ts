import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { createIndexStatements, createTableStatements } from './schema';

export async function runMigrations(db: SQLiteDBConnection) {
  await db.execute(createTableStatements);
  await db.execute(createIndexStatements);
}
