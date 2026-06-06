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
const preloadedDatabaseVersion = 'mockdata-2026-06-06';
const preloadedDatabaseKey = `liz_money_note.preloaded.${preloadedDatabaseVersion}`;

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

async function openAndMigrateConnection() {
  const connection = await createConnection();
  await connection.open();
  await runMigrations(connection);
  return connection;
}

async function hasBusinessData(connection: SQLiteDBConnection) {
  const result = await connection.query(
    `SELECT
      (SELECT COUNT(*) FROM transactions WHERE deleted_at IS NULL) AS transaction_count,
      (SELECT COUNT(*) FROM accounts) AS account_count,
      (SELECT COUNT(*) FROM tags) AS tag_count,
      (SELECT COUNT(*) FROM books WHERE name != '默认账本') AS non_default_book_count`
  );
  const row = (result.values ?? [])[0] as
    | {
        transaction_count?: number;
        account_count?: number;
        tag_count?: number;
        non_default_book_count?: number;
      }
    | undefined;

  return (
    Number(row?.transaction_count ?? 0) > 0 ||
    Number(row?.account_count ?? 0) > 0 ||
    Number(row?.tag_count ?? 0) > 0 ||
    Number(row?.non_default_book_count ?? 0) > 0
  );
}

function getPreloadedMarker() {
  return globalThis.localStorage?.getItem(preloadedDatabaseKey) ?? null;
}

function setPreloadedMarker() {
  globalThis.localStorage?.setItem(preloadedDatabaseKey, '1');
}

async function loadPreloadedDatabaseIfNeeded(
  connection: SQLiteDBConnection
): Promise<SQLiteDBConnection> {
  if (getPreloadedMarker()) {
    return connection;
  }

  if (await hasBusinessData(connection)) {
    setPreloadedMarker();
    return connection;
  }

  await connection.close();
  await connection.delete();
  await sqlite.copyFromAssets(true);
  setPreloadedMarker();
  return openAndMigrateConnection();
}

export async function getDatabase() {
  if (db) {
    return db;
  }

  if (!initPromise) {
    initPromise = (async () => {
      await prepareWebStore();
      const connection = await openAndMigrateConnection();
      db = await loadPreloadedDatabaseIfNeeded(connection);
      return db;
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
