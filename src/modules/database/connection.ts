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
const webWasmPath = '/assets/wasm';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;
let initPromise: Promise<SQLiteDBConnection> | null = null;
let databaseDebugSequence = 0;
const debugWrappedConnections = new WeakSet<SQLiteDBConnection>();

type DatabaseOperation = 'execute' | 'executeSet' | 'query' | 'run';

function roundDuration(value: number) {
  return Math.round(value * 100) / 100;
}

function compactSql(statement: string | undefined) {
  return statement?.replace(/\s+/g, ' ').trim() || '[empty]';
}

function sanitizeDatabaseValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return `[string:${value.length}]`;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeDatabaseValue);
  }

  if (value && typeof value === 'object') {
    return '[object]';
  }

  return value;
}

function sanitizeDatabaseValues(values?: unknown[]) {
  return values?.map(sanitizeDatabaseValue) ?? [];
}

function getResultSummary(result: unknown) {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const record = result as Record<string, unknown>;
  return {
    rowCount: Array.isArray(record.values) ? record.values.length : undefined,
    changes: record.changes
  };
}

function logDatabaseStart(
  operation: DatabaseOperation,
  id: number,
  detail: Record<string, unknown>
) {
  console.debug(`[database:${operation}] start`, {
    id,
    ...detail
  });
}

function logDatabaseDone(
  operation: DatabaseOperation,
  id: number,
  startedAt: number,
  result: unknown
) {
  console.debug(`[database:${operation}] done`, {
    id,
    durationMs: roundDuration(performance.now() - startedAt),
    result: getResultSummary(result)
  });
}

function logDatabaseFailed(
  operation: DatabaseOperation,
  id: number,
  startedAt: number,
  error: unknown
) {
  console.debug(`[database:${operation}] failed`, {
    id,
    durationMs: roundDuration(performance.now() - startedAt),
    error
  });
}

function wrapDatabaseDebug(connection: SQLiteDBConnection) {
  if (debugWrappedConnections.has(connection)) {
    return connection;
  }

  const originalQuery = connection.query.bind(connection);
  connection.query = async (statement, values) => {
    const id = ++databaseDebugSequence;
    const startedAt = performance.now();
    logDatabaseStart('query', id, {
      sql: compactSql(statement),
      values: sanitizeDatabaseValues(values),
      valueCount: values?.length ?? 0
    });

    try {
      const result = await originalQuery(statement, values);
      logDatabaseDone('query', id, startedAt, result);
      return result;
    } catch (error) {
      logDatabaseFailed('query', id, startedAt, error);
      throw error;
    }
  };

  const originalRun = connection.run.bind(connection);
  connection.run = async (statement, values, transaction) => {
    const id = ++databaseDebugSequence;
    const startedAt = performance.now();
    logDatabaseStart('run', id, {
      sql: compactSql(statement),
      values: sanitizeDatabaseValues(values),
      valueCount: values?.length ?? 0,
      transaction
    });

    try {
      const result = await originalRun(statement, values, transaction);
      logDatabaseDone('run', id, startedAt, result);
      return result;
    } catch (error) {
      logDatabaseFailed('run', id, startedAt, error);
      throw error;
    }
  };

  const originalExecute = connection.execute.bind(connection);
  connection.execute = async (statements, transaction) => {
    const id = ++databaseDebugSequence;
    const startedAt = performance.now();
    logDatabaseStart('execute', id, {
      sql: compactSql(statements),
      transaction
    });

    try {
      const result = await originalExecute(statements, transaction);
      logDatabaseDone('execute', id, startedAt, result);
      return result;
    } catch (error) {
      logDatabaseFailed('execute', id, startedAt, error);
      throw error;
    }
  };

  const originalExecuteSet = connection.executeSet.bind(connection);
  connection.executeSet = async (set, transaction, returnMode) => {
    const id = ++databaseDebugSequence;
    const startedAt = performance.now();
    logDatabaseStart('executeSet', id, {
      statementCount: set.length,
      statements: set.map((item) => ({
        sql: compactSql(item.statement),
        values: sanitizeDatabaseValues(item.values),
        valueCount: item.values?.length ?? 0
      })),
      transaction,
      returnMode
    });

    try {
      const result = await originalExecuteSet(set, transaction, returnMode);
      logDatabaseDone('executeSet', id, startedAt, result);
      return result;
    } catch (error) {
      logDatabaseFailed('executeSet', id, startedAt, error);
      throw error;
    }
  };

  debugWrappedConnections.add(connection);
  return connection;
}

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
  const debugConnection = wrapDatabaseDebug(connection);
  await runMigrations(debugConnection);
  return debugConnection;
}

async function initializeRuntimeDatabase() {
  const databaseExists = await sqlite.isDatabase(databaseName);

  if (!databaseExists.result) {
    await sqlite.copyFromAssets(false);
  }

  return openAndMigrateConnection();
}

export async function getDatabase() {
  if (db) {
    return db;
  }

  if (!initPromise) {
    initPromise = (async () => {
      await prepareWebStore();
      db = await initializeRuntimeDatabase();
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

  await sqlite.copyFromAssets(true);
  db = await openAndMigrateConnection();
  return db;
}

export { databaseName, sqlite };
