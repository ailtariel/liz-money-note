import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultDatabaseName = 'liz_money_note';
const defaultFileName = `${defaultDatabaseName}.db`;

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...valueParts] = arg.replace(/^--/, '').split('=');
    return [key, valueParts.join('=') || 'true'];
  })
);

const mode = args.get('mode') ?? process.env.NODE_ENV ?? 'development';
const profile = args.get('profile') ?? 'build';

function parseEnvFile(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const separatorIndex = line.indexOf('=');

      if (separatorIndex === -1) {
        return acc;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

async function loadEnv() {
  const files = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];
  const env = {};

  for (const file of files) {
    const filePath = path.join(rootDir, file);

    if (!existsSync(filePath)) {
      continue;
    }

    Object.assign(env, parseEnvFile(await readFile(filePath, 'utf8')));
  }

  return {
    ...env,
    ...process.env
  };
}

function resolveWorkspacePath(value) {
  if (!value) {
    return null;
  }

  return path.isAbsolute(value) ? value : path.join(rootDir, value);
}

function runSqlite(sqlitePath, dbPath, input) {
  const result = spawnSync(sqlitePath, [dbPath], {
    input,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'sqlite3 failed.');
  }

  return result.stdout.trim();
}

async function createOrMigrateDatabase({ dbPath, force, sqlitePath, sql }) {
  await mkdir(path.dirname(dbPath), { recursive: true });

  if (force) {
    await rm(dbPath, { force: true });
  }

  runSqlite(sqlitePath, dbPath, sql);
}

async function writeAssetManifest(assetDir, databaseFileName) {
  await mkdir(assetDir, { recursive: true });
  await writeFile(
    path.join(assetDir, 'databases.json'),
    `${JSON.stringify({ databaseList: [databaseFileName] }, null, 2)}\n`,
    'utf8'
  );
}

const env = await loadEnv();
const sqlitePath = env.DB_SQLITE_PATH ?? env.SQLITE3_PATH ?? 'sqlite3';
const databaseName = env.DB_NAME ?? defaultDatabaseName;
const databaseFileName = env.DB_FILE_NAME ?? `${databaseName}.db`;
const assetDir =
  resolveWorkspacePath(env.DB_ASSET_DIR) ??
  path.join(rootDir, 'public/assets/databases');
const localDbPath =
  resolveWorkspacePath(env.DB_LOCAL_PATH) ??
  path.join(rootDir, '.local/databases', databaseFileName);
const assetDbPath = path.join(assetDir, databaseFileName);

const schemaModuleUrl = pathToFileURL(
  path.join(rootDir, 'src/modules/database/schema.ts')
).href;
const { createTableStatements, createIndexStatements } = await import(
  schemaModuleUrl
);

const initializationSql = [createTableStatements, createIndexStatements].join(
  '\n'
);

if (profile === 'dev') {
  await createOrMigrateDatabase({
    dbPath: localDbPath,
    force: false,
    sqlitePath,
    sql: initializationSql
  });
  await mkdir(assetDir, { recursive: true });
  await copyFile(localDbPath, assetDbPath);
  await writeAssetManifest(assetDir, databaseFileName);
  console.log(`Prepared local development database ${localDbPath}`);
  console.log(`Synced database asset ${assetDbPath}`);
} else {
  await createOrMigrateDatabase({
    dbPath: assetDbPath,
    force: true,
    sqlitePath,
    sql: initializationSql
  });
  await writeAssetManifest(assetDir, databaseFileName);
  console.log(`Generated empty database asset ${assetDbPath}`);
}
