import { Pool, type PoolClient } from 'pg';
import { getRecordId, type CollectionDataType, type SingletonDataType } from './data-types';

declare global {
  // eslint-disable-next-line no-var
  var __fenixPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __fenixServerCache: Map<string, { expiresAt: number; value: unknown }> | undefined;
}

const connectionString = process.env.DATABASE_URL;
const sslMode = process.env.PGSSL?.toLowerCase() ?? 'require';
const SERVER_CACHE_TTL_MS = 10_000;

const getSslConfig = () => {
  if (sslMode === 'disable') {
    return undefined;
  }

  return { rejectUnauthorized: false };
};

const getPgPool = (): Pool => {
  if (!connectionString) {
    throw new Error('DATABASE_URL nao configurada.');
  }

  if (!global.__fenixPgPool) {
    global.__fenixPgPool = new Pool({
      connectionString,
      ssl: getSslConfig(),
    });
  }

  return global.__fenixPgPool;
};

const getServerCache = () => {
  if (!global.__fenixServerCache) {
    global.__fenixServerCache = new Map();
  }

  return global.__fenixServerCache;
};

const readCache = <T>(key: string): T | undefined => {
  const entry = getServerCache().get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    getServerCache().delete(key);
    return undefined;
  }

  return entry.value as T;
};

const writeCache = <T>(key: string, value: T, ttlMs = SERVER_CACHE_TTL_MS): T => {
  getServerCache().set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  return value;
};

const invalidateCacheKey = (key: string) => {
  getServerCache().delete(key);
};

const invalidateCollectionCaches = (dataType: CollectionDataType) => {
  invalidateCacheKey(`collection:${dataType}`);

  if (dataType === 'users') {
    invalidateCacheKey('users:count');
    for (const key of getServerCache().keys()) {
      if (key.startsWith('user:id:') || key.startsWith('user:login:')) {
        invalidateCacheKey(key);
      }
    }
  }

  if (dataType === 'customers') {
    for (const key of getServerCache().keys()) {
      if (key.startsWith('customers:search:')) {
        invalidateCacheKey(key);
      }
    }
  }
};

const invalidateSingletonCache = (dataType: SingletonDataType) => {
  invalidateCacheKey(`singleton:${dataType}`);
};

export const withTransaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await getPgPool().connect();
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
  const cached = readCache<T[]>(`collection:${dataType}`);
  if (cached !== undefined) {
    return cached;
  }

  const result = await getPgPool().query<{ data: T }>(
    `SELECT data FROM app_records WHERE collection = $1 ORDER BY updated_at DESC, record_id ASC`,
    [dataType]
  );
  return writeCache(
    `collection:${dataType}`,
    result.rows.map((row: { data: T }) => row.data)
  );
};

export const listCollectionWithClient = async <T>(client: PoolClient, dataType: CollectionDataType): Promise<T[]> => {
  const result = await client.query<{ data: T }>(
    `SELECT data FROM app_records WHERE collection = $1 ORDER BY updated_at DESC, record_id ASC`,
    [dataType]
  );
  return result.rows.map((row: { data: T }) => row.data);
};

export const replaceCollection = async <T extends Record<string, unknown>>(dataType: CollectionDataType, records: T[]): Promise<void> => {
  await withTransaction(async (client) => {
    await replaceCollectionWithClient(client, dataType, records);
  });
};

export const replaceCollectionWithClient = async <T extends Record<string, unknown>>(
  client: PoolClient,
  dataType: CollectionDataType,
  records: T[]
): Promise<void> => {
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

  invalidateCollectionCaches(dataType);
};

export const upsertCollectionRecord = async <T extends Record<string, unknown>>(
  dataType: CollectionDataType,
  record: T
): Promise<void> => {
  await withTransaction(async (client) => {
    await upsertCollectionRecordWithClient(client, dataType, record);
  });
};

export const upsertCollectionRecordWithClient = async <T extends Record<string, unknown>>(
  client: PoolClient,
  dataType: CollectionDataType,
  record: T
): Promise<void> => {
  const recordId = getRecordId(dataType, record);
  await client.query(
    `
      INSERT INTO app_records (collection, record_id, data, updated_at)
      VALUES ($1, $2, $3::jsonb, NOW())
      ON CONFLICT (collection, record_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    [dataType, recordId, JSON.stringify(record)]
  );

  invalidateCollectionCaches(dataType);
};

export const deleteCollectionRecordWithClient = async (
  client: PoolClient,
  dataType: CollectionDataType,
  recordId: string
): Promise<void> => {
  await client.query(
    `
      DELETE FROM app_records
      WHERE collection = $1 AND record_id = $2
    `,
    [dataType, recordId]
  );

  invalidateCollectionCaches(dataType);
};

export const getSingleton = async <T>(dataType: SingletonDataType): Promise<T | null> => {
  const cached = readCache<T | null>(`singleton:${dataType}`);
  if (cached !== undefined) {
    return cached;
  }

  const result = await getPgPool().query<{ data: T }>(
    `SELECT data FROM app_singletons WHERE collection = $1`,
    [dataType]
  );
  return writeCache(`singleton:${dataType}`, result.rows[0]?.data ?? null);
};

export const saveSingleton = async <T>(dataType: SingletonDataType, data: T): Promise<void> => {
  await getPgPool().query(
    `
      INSERT INTO app_singletons (collection, data, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (collection)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    [dataType, JSON.stringify(data)]
  );
  invalidateSingletonCache(dataType);
};

export const getUserByLogin = async <T>(login: string): Promise<T | null> => {
  const normalizedLogin = login.trim().toLowerCase();
  const cacheKey = `user:login:${normalizedLogin}`;
  const cached = readCache<T | null>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = await getPgPool().query<{ data: T }>(
    `
      SELECT data
      FROM app_records
      WHERE collection = 'users' AND lower(trim(data->>'login')) = $1
      LIMIT 1
    `,
    [normalizedLogin]
  );
  return writeCache(cacheKey, result.rows[0]?.data ?? null);
};

export const getUserById = async <T>(userId: string): Promise<T | null> => {
  const cacheKey = `user:id:${userId}`;
  const cached = readCache<T | null>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = await getPgPool().query<{ data: T }>(
    `
      SELECT data
      FROM app_records
      WHERE collection = 'users' AND record_id = $1
      LIMIT 1
    `,
    [userId]
  );
  return writeCache(cacheKey, result.rows[0]?.data ?? null);
};

export const countUsers = async (): Promise<number> => {
  const cached = readCache<number>('users:count');
  if (cached !== undefined) {
    return cached;
  }

  const result = await getPgPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM app_records WHERE collection = 'users'`
  );
  return writeCache('users:count', Number(result.rows[0]?.count ?? '0'));
};

type CustomerSearchRow = {
  id: string;
  name: string;
  phone: string;
};

export const searchCustomersByName = async (
  name: string,
  limit = 10
): Promise<CustomerSearchRow[]> => {
  const trimmedName = name.trim().toLowerCase();
  if (!trimmedName) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 15);
  const cacheKey = `customers:search:${safeLimit}:${trimmedName}`;
  const cached = readCache<CustomerSearchRow[]>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = await getPgPool().query<CustomerSearchRow>(
    `
      SELECT
        record_id AS id,
        COALESCE(data->>'name', '') AS name,
        COALESCE(data->>'phone', '') AS phone
      FROM app_records
      WHERE collection = 'customers'
        AND lower(COALESCE(data->>'name', '')) LIKE '%' || $2 || '%'
      ORDER BY
        CASE
          WHEN lower(COALESCE(data->>'name', '')) LIKE $2 || '%' THEN 0
          ELSE 1
        END ASC,
        POSITION($2 IN lower(COALESCE(data->>'name', ''))) ASC,
        char_length(COALESCE(data->>'name', '')) ASC,
        lower(COALESCE(data->>'name', '')) ASC
      LIMIT $1
    `,
    [safeLimit, trimmedName]
  );

  return writeCache(cacheKey, result.rows);
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
  const [recordsResult, singletonsResult] = await Promise.all([
    getPgPool().query<BackupRecordRow>(
      `
        SELECT collection, record_id, data
        FROM app_records
        ORDER BY collection ASC, updated_at ASC, record_id ASC
      `
    ),
    getPgPool().query<BackupSingletonRow>(
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
