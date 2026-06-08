import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection
} from '@capacitor-community/sqlite';
import { defineCustomElements as defineJeepSqlite } from 'jeep-sqlite/loader';
import { runMigrations } from './migrations';

const databaseName = __DB_NAME__;
const databaseEncryptionMode = __DB_ENCRYPTION_MODE__;
const databaseVersion = __DB_VERSION__;
const databaseAssetMarkerKey = `${databaseName}.asset-database.initialized`;
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

  return sqlite.createConnection(
    databaseName,
    false,
    databaseEncryptionMode,
    databaseVersion,
    false
  );
}

async function openAndMigrateConnection() {
  const connection = await createConnection();
  await connection.open();
  await runMigrations(connection);
  return connection;
}

async function hasPersistedData(connection: SQLiteDBConnection) {
  const result = await connection.query(
    `SELECT
      (SELECT COUNT(*) FROM books) AS book_count,
      (SELECT COUNT(*) FROM accounts) AS account_count,
      (SELECT COUNT(*) FROM tags) AS tag_count,
      (SELECT COUNT(*) FROM transactions) AS transaction_count,
      (SELECT COUNT(*) FROM recurring_events) AS recurring_event_count,
      (SELECT COUNT(*) FROM settings) AS setting_count,
      (SELECT COUNT(*) FROM currencies) AS currency_count,
      (SELECT COUNT(*) FROM currency_rates) AS currency_rate_count`
  );
  const row = (result.values ?? [])[0] as Record<string, number> | undefined;

  return Object.values(row ?? {}).some((value) => Number(value) > 0);
}

function getDatabaseAssetMarker() {
  return globalThis.localStorage?.getItem(databaseAssetMarkerKey) ?? null;
}

function setDatabaseAssetMarker() {
  globalThis.localStorage?.setItem(databaseAssetMarkerKey, '1');
}

function clearDatabaseAssetMarker() {
  globalThis.localStorage?.removeItem(databaseAssetMarkerKey);
}

async function initializeFromAssetsIfNeeded(
  connection: SQLiteDBConnection
): Promise<SQLiteDBConnection> {
  if (getDatabaseAssetMarker()) {
    return connection;
  }

  if (await hasPersistedData(connection)) {
    setDatabaseAssetMarker();
    return connection;
  }

  await connection.close();
  await connection.delete();
  await sqlite.copyFromAssets(true);
  setDatabaseAssetMarker();
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
      db = await initializeFromAssetsIfNeeded(connection);
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

export async function resetDatabaseToAssets() {
  const connection = await getDatabase();

  await connection.close();
  await connection.delete();
  db = null;
  initPromise = null;
  clearDatabaseAssetMarker();

  await sqlite.copyFromAssets(true);
  setDatabaseAssetMarker();
  db = await openAndMigrateConnection();
  return db;
}

export { databaseName, sqlite };
