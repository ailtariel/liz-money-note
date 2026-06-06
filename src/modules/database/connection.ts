import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection
} from '@capacitor-community/sqlite';
import { defineCustomElements as defineJeepSqlite } from 'jeep-sqlite/loader';
import { runMigrations } from './migrations';

const databaseName = 'liz_money_note';
const webWasmPath = '/assets/wasm';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;
let initPromise: Promise<SQLiteDBConnection> | null = null;

async function prepareWebStore() {
  if (Capacitor.getPlatform() !== 'web') {
    return;
  }

  defineJeepSqlite(window);

  if (!document.querySelector('jeep-sqlite')) {
    const jeepSqlite = document.createElement('jeep-sqlite');
    jeepSqlite.setAttribute('wasmPath', webWasmPath);
    document.body.appendChild(jeepSqlite);
  }

  await customElements.whenDefined('jeep-sqlite');
  await sqlite.initWebStore();
}

async function createConnection() {
  const consistency = await sqlite.checkConnectionsConsistency();
  const hasConnection = await sqlite.isConnection(databaseName, false);

  if (consistency.result && hasConnection.result) {
    return sqlite.retrieveConnection(databaseName, false);
  }

  return sqlite.createConnection(databaseName, false, 'no-encryption', 1, false);
}

export async function getDatabase() {
  if (db) {
    return db;
  }

  if (!initPromise) {
    initPromise = (async () => {
      await prepareWebStore();
      const connection = await createConnection();
      await connection.open();
      await runMigrations(connection);
      db = connection;
      return connection;
    })();
  }

  return initPromise;
}

export async function persistDatabase() {
  if (Capacitor.getPlatform() === 'web') {
    await sqlite.saveToStore(databaseName);
  }
}

export async function resetDatabaseConnection() {
  if (!db) {
    initPromise = null;
    return;
  }

  await db.close();
  db = null;
  initPromise = null;
}

export { databaseName, sqlite };
