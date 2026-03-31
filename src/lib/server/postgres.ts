import { Pool, type PoolClient } from 'pg';
import { getRecordId, type CollectionDataType, type SingletonDataType } from './data-types';

declare global {
  // eslint-disable-next-line no-var
  var __fenixPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __fenixPgSchemaReady: Promise<void> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL nao configurada. As rotas de persistencia com PostgreSQL vao falhar ate a variavel ser definida.');
}

export const pgPool =
  global.__fenixPgPool ??
  new Pool({
    connectionString,
    ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : undefined,
  });

if (!global.__fenixPgPool) {
  global.__fenixPgPool = pgPool;
}

const ensureSchemaInternal = async () => {
  if (!connectionString) {
    throw new Error('DATABASE_URL nao configurada.');
  }

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS app_records (
      collection TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (collection, record_id)
    );
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS app_singletons (
      collection TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pgPool.query(`
    CREATE INDEX IF NOT EXISTS idx_app_records_users_login
    ON app_records ((data->>'login'))
    WHERE collection = 'users';
  `);
};

export const ensureSchema = async () => {
  if (!global.__fenixPgSchemaReady) {
    global.__fenixPgSchemaReady = ensureSchemaInternal();
  }
  return global.__fenixPgSchemaReady;
};

export const withTransaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  await ensureSchema();
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const listCollection = async <T>(dataType: CollectionDataType): Promise<T[]> => {
  await ensureSchema();
  const result = await pgPool.query<{ data: T }>(
    `SELECT data FROM app_records WHERE collection = $1 ORDER BY updated_at DESC, record_id ASC`,
    [dataType]
  );
  return result.rows.map((row: { data: T }) => row.data);
};

export const replaceCollection = async <T extends Record<string, unknown>>(dataType: CollectionDataType, records: T[]): Promise<void> => {
  await withTransaction(async (client) => {
    await client.query(`DELETE FROM app_records WHERE collection = $1`, [dataType]);

    for (const record of records) {
      const recordId = getRecordId(dataType, record);
      await client.query(
        `
          INSERT INTO app_records (collection, record_id, data, updated_at)
          VALUES ($1, $2, $3::jsonb, NOW())
        `,
        [dataType, recordId, JSON.stringify(record)]
      );
    }
  });
};

export const getSingleton = async <T>(dataType: SingletonDataType): Promise<T | null> => {
  await ensureSchema();
  const result = await pgPool.query<{ data: T }>(
    `SELECT data FROM app_singletons WHERE collection = $1`,
    [dataType]
  );
  return result.rows[0]?.data ?? null;
};

export const saveSingleton = async <T>(dataType: SingletonDataType, data: T): Promise<void> => {
  await ensureSchema();
  await pgPool.query(
    `
      INSERT INTO app_singletons (collection, data, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (collection)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    [dataType, JSON.stringify(data)]
  );
};

export const getUserByLogin = async <T>(login: string): Promise<T | null> => {
  await ensureSchema();
  const result = await pgPool.query<{ data: T }>(
    `
      SELECT data
      FROM app_records
      WHERE collection = 'users' AND data->>'login' = $1
      LIMIT 1
    `,
    [login]
  );
  return result.rows[0]?.data ?? null;
};

export const getUserById = async <T>(userId: string): Promise<T | null> => {
  await ensureSchema();
  const result = await pgPool.query<{ data: T }>(
    `
      SELECT data
      FROM app_records
      WHERE collection = 'users' AND record_id = $1
      LIMIT 1
    `,
    [userId]
  );
  return result.rows[0]?.data ?? null;
};

export const countUsers = async (): Promise<number> => {
  await ensureSchema();
  const result = await pgPool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM app_records WHERE collection = 'users'`
  );
  return Number(result.rows[0]?.count ?? '0');
};

type BackupRecordRow = {
  collection: string;
  record_id: string;
  data: unknown;
};

type BackupSingletonRow = {
  collection: string;
  data: unknown;
};

const escapeSqlLiteral = (value: string): string => value.replace(/'/g, "''");

export const exportSqlSnapshot = async (): Promise<string> => {
  await ensureSchema();

  const [recordsResult, singletonsResult] = await Promise.all([
    pgPool.query<BackupRecordRow>(
      `
        SELECT collection, record_id, data
        FROM app_records
        ORDER BY collection ASC, updated_at ASC, record_id ASC
      `
    ),
    pgPool.query<BackupSingletonRow>(
      `
        SELECT collection, data
        FROM app_singletons
        ORDER BY collection ASC
      `
    ),
  ]);

  const statements: string[] = [
    '-- Assistec Now PostgreSQL backup',
    `-- Created at ${new Date().toISOString()}`,
    'BEGIN;',
    'CREATE TABLE IF NOT EXISTS app_records (collection TEXT NOT NULL, record_id TEXT NOT NULL, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (collection, record_id));',
    'CREATE TABLE IF NOT EXISTS app_singletons (collection TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());',
    "CREATE INDEX IF NOT EXISTS idx_app_records_users_login ON app_records ((data->>'login')) WHERE collection = 'users';",
    'TRUNCATE TABLE app_records, app_singletons;',
  ];

  for (const row of recordsResult.rows) {
    statements.push(
      `INSERT INTO app_records (collection, record_id, data, updated_at) VALUES ('${escapeSqlLiteral(row.collection)}', '${escapeSqlLiteral(row.record_id)}', '${escapeSqlLiteral(JSON.stringify(row.data))}'::jsonb, NOW());`
    );
  }

  for (const row of singletonsResult.rows) {
    statements.push(
      `INSERT INTO app_singletons (collection, data, updated_at) VALUES ('${escapeSqlLiteral(row.collection)}', '${escapeSqlLiteral(JSON.stringify(row.data))}'::jsonb, NOW());`
    );
  }

  statements.push('COMMIT;');

  return `${statements.join('\n')}\n`;
};
