import crypto from 'node:crypto';
import type { User, UserPermissions } from '@/types';

const HASH_PREFIX = 'scrypt';
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const KEY_LENGTH = 64;

const toBase64Url = (value: Buffer) => value.toString('base64url');

const isLegacyBase64Password = (value: string): boolean => {
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    return Buffer.from(decoded, 'utf8').toString('base64') === value;
  } catch {
    return false;
  }
};

const decodeLegacyBase64Password = (value: string): string => Buffer.from(value, 'base64').toString('utf8');

const hashPasswordWithSalt = async (password: string, salt: Buffer): Promise<string> => {
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
      },
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(key as Buffer);
      }
    );
  });

  return [
    HASH_PREFIX,
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    toBase64Url(salt),
    toBase64Url(derivedKey),
  ].join('$');
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16);
  return hashPasswordWithSalt(password, salt);
};

export const isPasswordHash = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.startsWith(`${HASH_PREFIX}$`);

const verifyPasswordHash = async (hash: string, password: string): Promise<boolean> => {
  const [prefix, cost, blockSize, parallelization, saltValue, keyValue] = hash.split('$');
  if (
    prefix !== HASH_PREFIX ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !saltValue ||
    !keyValue
  ) {
    return false;
  }

  const expectedKey = Buffer.from(keyValue, 'base64url');
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      Buffer.from(saltValue, 'base64url'),
      expectedKey.length,
      {
        N: Number(cost),
        r: Number(blockSize),
        p: Number(parallelization),
      },
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(key as Buffer);
      }
    );
  });

  return (
    derivedKey.length === expectedKey.length &&
    crypto.timingSafeEqual(derivedKey, expectedKey)
  );
};

export const sanitizeUser = <T extends User>(user: T): Omit<T, 'password'> => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

export const sanitizeUsers = <T extends User>(users: T[]): Array<Omit<T, 'password'>> =>
  users.map((user) => sanitizeUser(user));

export const hasPermission = (user: User | null | undefined, permission: keyof UserPermissions): boolean => {
  if (!user) return false;
  if (!user.permissions) return true;
  return user.permissions[permission] === true;
};

export const verifyPassword = async (
  storedPassword: string | null | undefined,
  password: string
): Promise<{ valid: boolean; needsUpgrade: boolean; upgradedHash?: string }> => {
  if (!storedPassword) {
    return { valid: false, needsUpgrade: false };
  }

  if (isPasswordHash(storedPassword)) {
    return {
      valid: await verifyPasswordHash(storedPassword, password),
      needsUpgrade: false,
    };
  }

  if (!isLegacyBase64Password(storedPassword)) {
    return { valid: false, needsUpgrade: false };
  }

  const valid = decodeLegacyBase64Password(storedPassword) === password;
  if (!valid) {
    return { valid: false, needsUpgrade: false };
  }

  return {
    valid: true,
    needsUpgrade: true,
    upgradedHash: await hashPassword(password),
  };
};

export const normalizeIncomingPassword = async (
  incomingPassword: string | undefined,
  existingPassword?: string
): Promise<string | undefined> => {
  if (typeof incomingPassword !== 'string') {
    return existingPassword;
  }

  const trimmedPassword = incomingPassword.trim();
  if (!trimmedPassword) {
    return existingPassword;
  }

  if (isPasswordHash(trimmedPassword)) {
    return trimmedPassword;
  }

  if (isLegacyBase64Password(trimmedPassword)) {
    return hashPassword(decodeLegacyBase64Password(trimmedPassword));
  }

  return hashPassword(trimmedPassword);
};
